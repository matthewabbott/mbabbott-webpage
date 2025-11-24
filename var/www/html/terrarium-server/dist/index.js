import 'dotenv/config';
import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
const CHAT_PASSWORD = process.env.CHAT_PASSWORD ?? 'terra-access';
const SERVICE_TOKEN = process.env.SERVICE_TOKEN ?? 'super-secret-service-token';
const PORT = Number(process.env.PORT ?? 4100);
const BASE_PATH = (process.env.BASE_PATH ?? '').replace(/\/$/, '');
const WORKER_STALE_THRESHOLD_MS = Number(process.env.WORKER_STALE_THRESHOLD_MS ?? 60_000);
const chats = new Map();
const connections = new Map();
let lastWorkerSeenAt = null;
let workerStatus = null;
const workerSockets = new Set();
const chatWorkerStates = new Map();
const app = express();
app.use(express.json());
const apiRouter = express.Router();
function recordWorkerHeartbeat() {
    lastWorkerSeenAt = Date.now();
}
function ensureChat(chatId) {
    if (!chats.has(chatId)) {
        chats.set(chatId, []);
    }
    return chats.get(chatId);
}
function broadcast(chatId, message) {
    const sockets = connections.get(chatId);
    if (!sockets)
        return;
    for (const socket of sockets) {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        }
    }
}
function notifyWorkers(event) {
    const payload = JSON.stringify(event);
    for (const socket of workerSockets) {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(payload);
        }
        else {
            workerSockets.delete(socket);
        }
    }
}
function getWorkerState(chatId) {
    return (chatWorkerStates.get(chatId) ?? {
        state: 'idle',
        detail: null,
        updatedAt: new Date(0).toISOString()
    });
}
function setWorkerState(chatId, state, detail) {
    const payload = {
        state,
        detail: detail ?? null,
        updatedAt: new Date().toISOString()
    };
    chatWorkerStates.set(chatId, payload);
    broadcastWorkerState(chatId, payload);
}
function broadcastWorkerState(chatId, payload) {
    const sockets = connections.get(chatId);
    if (!sockets)
        return;
    const message = JSON.stringify({
        type: 'workerState',
        chatId,
        state: payload.state,
        detail: payload.detail,
        updatedAt: payload.updatedAt
    });
    for (const socket of sockets) {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
        }
    }
}
function broadcastAssistantChunk(chatId, content, done) {
    const sockets = connections.get(chatId);
    if (!sockets)
        return;
    const payload = {
        type: 'assistantChunk',
        chatId,
        content,
        done,
        emittedAt: new Date().toISOString()
    };
    const serialized = JSON.stringify(payload);
    for (const socket of sockets) {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(serialized);
        }
    }
}
apiRouter.post('/chat/:chatId/messages', (req, res) => {
    const { chatId } = req.params;
    const { content, accessCode } = req.body;
    if (accessCode !== CHAT_PASSWORD) {
        return res.status(401).json({ error: 'Invalid access code' });
    }
    if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Message content required' });
    }
    const message = {
        id: randomUUID(),
        chatId,
        sender: 'Visitor',
        content,
        createdAt: new Date().toISOString()
    };
    ensureChat(chatId).push(message);
    broadcast(chatId, message);
    notifyWorkers({
        type: 'chat_activity',
        chatId,
        messageId: message.id,
        emittedAt: new Date().toISOString()
    });
    setWorkerState(chatId, 'queued');
    res.json(message);
});
apiRouter.get('/chat/:chatId/messages', (req, res) => {
    const { chatId } = req.params;
    const accessCode = req.query.accessCode ?? undefined;
    const token = req.headers['x-service-token'];
    if (token === SERVICE_TOKEN) {
        recordWorkerHeartbeat();
    }
    else if (accessCode !== CHAT_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json(ensureChat(chatId));
});
apiRouter.post('/chat/:chatId/agent', (req, res) => {
    const { chatId } = req.params;
    const token = req.headers['x-service-token'];
    if (token !== SERVICE_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    recordWorkerHeartbeat();
    const { content } = req.body;
    if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Message content required' });
    }
    const message = {
        id: randomUUID(),
        chatId,
        sender: 'Terra',
        content,
        createdAt: new Date().toISOString()
    };
    ensureChat(chatId).push(message);
    broadcast(chatId, message);
    res.json(message);
});
apiRouter.post('/chat/:chatId/agent-chunk', (req, res) => {
    const { chatId } = req.params;
    const token = req.headers['x-service-token'];
    if (token !== SERVICE_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    recordWorkerHeartbeat();
    const { content, done } = req.body;
    if (typeof content !== 'string') {
        return res.status(400).json({ error: 'Chunk content required' });
    }
    broadcastAssistantChunk(chatId, content, Boolean(done));
    res.json({ ok: true });
});
apiRouter.get('/chats/open', (req, res) => {
    const token = req.headers['x-service-token'];
    if (token !== SERVICE_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    recordWorkerHeartbeat();
    res.json({ chatIds: Array.from(chats.keys()) });
});
const validStatus = ['online', 'degraded', 'offline', 'unknown'];
function normalizeComponentStatus(input, fallbackDetail) {
    const payload = (typeof input === 'object' && input !== null ? input : {});
    const status = validStatus.includes(payload.status ?? 'unknown')
        ? payload.status
        : 'unknown';
    const detail = typeof payload.detail === 'string' || payload.detail === null
        ? payload.detail
        : status === 'unknown'
            ? fallbackDetail
            : null;
    const checkedAt = typeof payload.checkedAt === 'string' ? payload.checkedAt : null;
    const latencyMs = typeof payload.latencyMs === 'number' ? payload.latencyMs : null;
    return { status, detail, checkedAt, latencyMs };
}
apiRouter.post('/worker/status', (req, res) => {
    const token = req.headers['x-service-token'];
    if (token !== SERVICE_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const body = req.body;
    workerStatus = {
        agentApi: normalizeComponentStatus(body?.agentApi, 'Awaiting agent health data'),
        llm: normalizeComponentStatus(body?.llm, 'Awaiting LLM health data'),
    };
    recordWorkerHeartbeat();
    return res.json({ ok: true });
});
const workerStateValues = ['idle', 'queued', 'processing', 'responded', 'error'];
apiRouter.post('/chat/:chatId/worker-state', (req, res) => {
    const token = req.headers['x-service-token'];
    if (token !== SERVICE_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { chatId } = req.params;
    const { state, detail } = req.body;
    if (!state || !workerStateValues.includes(state)) {
        return res.status(400).json({ error: 'Invalid worker state' });
    }
    setWorkerState(chatId, state, typeof detail === 'string' ? detail : null);
    return res.json({ ok: true });
});
apiRouter.get('/chat/:chatId/worker-state', (req, res) => {
    const { chatId } = req.params;
    const accessCode = req.query.accessCode ?? undefined;
    const token = req.headers['x-service-token'];
    if (token !== SERVICE_TOKEN && accessCode !== CHAT_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json(getWorkerState(chatId));
});
apiRouter.get('/health', (req, res) => {
    const accessCode = req.query.accessCode ?? undefined;
    if (accessCode !== CHAT_PASSWORD) {
        return res.status(401).json({ error: 'Invalid access code' });
    }
    const workerReady = lastWorkerSeenAt !== null ? Date.now() - lastWorkerSeenAt <= WORKER_STALE_THRESHOLD_MS : false;
    const workerLastSeenIso = lastWorkerSeenAt ? new Date(lastWorkerSeenAt).toISOString() : null;
    const nowIso = new Date().toISOString();
    const workerDetail = workerReady
        ? null
        : workerLastSeenIso
            ? 'Worker heartbeat expired'
            : 'Worker has not checked in yet';
    const workerOfflineDetail = workerLastSeenIso
        ? `Worker offline; last heartbeat at ${workerLastSeenIso}`
        : 'Worker offline; no heartbeat received yet';
    const agentStatus = workerReady && workerStatus?.agentApi
        ? workerStatus.agentApi
        : {
            status: workerReady ? 'unknown' : 'offline',
            detail: workerReady ? 'Awaiting agent health data' : workerOfflineDetail,
            checkedAt: workerReady ? null : workerLastSeenIso,
            latencyMs: null
        };
    const llmStatus = workerReady && workerStatus?.llm
        ? workerStatus.llm
        : {
            status: workerReady ? 'unknown' : 'offline',
            detail: workerReady ? 'Awaiting LLM health data' : workerOfflineDetail,
            checkedAt: workerReady ? null : workerLastSeenIso,
            latencyMs: null
        };
    const statusChain = [
        { id: 'frontend', label: 'Frontend', status: 'online', detail: null, checkedAt: nowIso },
        { id: 'relay', label: 'Relay', status: 'online', detail: null, checkedAt: nowIso },
        {
            id: 'worker',
            label: 'Webchat worker',
            status: workerReady ? 'online' : 'offline',
            detail: workerDetail,
            checkedAt: workerLastSeenIso,
        },
        { id: 'agent', label: 'terrarium-agent', ...normalizeComponentStatus(agentStatus, 'Awaiting agent health data') },
        { id: 'llm', label: 'vLLM', ...normalizeComponentStatus(llmStatus, 'Awaiting LLM health data') },
    ];
    res.json({
        relay: 'ok',
        workerReady,
        workerLastSeenAt: workerLastSeenIso,
        workerStatus,
        chain: statusChain,
    });
});
const mountPoints = new Set(['/api']);
if (BASE_PATH) {
    mountPoints.add(`${BASE_PATH}/api`);
}
for (const mount of mountPoints) {
    app.use(mount, apiRouter);
}
const server = createServer(app);
const wsServer = new WebSocketServer({ noServer: true });
const chatWsPaths = new Set(Array.from(mountPoints, (mount) => `${mount}/chat`));
const workerWsPaths = new Set(Array.from(mountPoints, (mount) => `${mount}/worker/updates`));
const wsPaths = new Set([...chatWsPaths, ...workerWsPaths]);
server.on('upgrade', (request, socket, head) => {
    try {
        const { pathname } = new URL(request.url ?? '', 'http://localhost');
        if (!wsPaths.has(pathname ?? '')) {
            socket.destroy();
            return;
        }
        wsServer.handleUpgrade(request, socket, head, (ws) => {
            wsServer.emit('connection', ws, request);
        });
    }
    catch {
        socket.destroy();
    }
});
wsServer.on('connection', (socket, request) => {
    const url = new URL(request.url ?? '', 'http://localhost');
    const pathname = url.pathname ?? '';
    if (workerWsPaths.has(pathname)) {
        const token = request.headers['x-service-token'];
        if (token !== SERVICE_TOKEN) {
            socket.close(1008, 'Unauthorized');
            return;
        }
        workerSockets.add(socket);
        socket.on('close', () => {
            workerSockets.delete(socket);
        });
        return;
    }
    if (!chatWsPaths.has(pathname)) {
        socket.close(1008, 'Unknown path');
        return;
    }
    const chatId = url.searchParams.get('chatId');
    const accessCode = url.searchParams.get('accessCode');
    if (!chatId || accessCode !== CHAT_PASSWORD) {
        socket.close(1008, 'Unauthorized');
        return;
    }
    const set = connections.get(chatId) ?? new Set();
    set.add(socket);
    connections.set(chatId, set);
    socket.on('close', () => {
        set.delete(socket);
        if (set.size === 0) {
            connections.delete(chatId);
        }
    });
});
server.listen(PORT, () => {
    console.log(`REST chat relay listening on ${PORT}`);
});
