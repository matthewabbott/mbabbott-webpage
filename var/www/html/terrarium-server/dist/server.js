import 'dotenv/config';
import { createServer } from 'http';
import pino from 'pino';
import { createSchema, createYoga, createPubSub } from 'graphql-yoga';
import { useServer } from 'graphql-ws/use/ws';
import { WebSocketServer } from 'ws';
import { buildChatModule } from './chatModule.js';
import { InMemoryChatStore } from './store.js';
import { loadEnv } from './env.js';
const env = loadEnv();
const logger = pino({ name: 'terrarium-webchat-vps', level: env.LOG_LEVEL });
const store = new InMemoryChatStore({ ttlHours: env.CHAT_TTL_HOURS });
const pubSub = createPubSub();
const chatModule = buildChatModule();
const schema = createSchema({
    typeDefs: chatModule.typeDefs,
    resolvers: chatModule.resolvers
});
function toHeaders(input) {
    if (input instanceof Headers) {
        return input;
    }
    const headers = new Headers();
    if (!input) {
        return headers;
    }
    for (const [key, value] of Object.entries(input)) {
        if (Array.isArray(value)) {
            value.forEach((entry) => {
                if (typeof entry === 'string')
                    headers.append(key, entry);
            });
        }
        else if (typeof value === 'string') {
            headers.set(key, value);
        }
    }
    return headers;
}
function nodeRequestToFetch(request) {
    const headers = toHeaders(request.headers);
    const protocol = headers.get('x-forwarded-proto') ?? 'http';
    const host = headers.get('host') ?? 'localhost';
    const url = new URL(request.url ?? yoga.graphqlEndpoint, `${protocol}://${host}`);
    const method = request.method ?? 'POST';
    return new Request(url, {
        method,
        headers
    });
}
const yoga = createYoga({
    schema,
    maskedErrors: false,
    context: ({ request }) => ({
        store,
        env,
        pubSub: pubSub,
        requestHeaders: toHeaders(request.headers)
    }),
    logging: {
        debug: (...args) => logger.debug(args),
        info: (...args) => logger.info(args),
        warn: (...args) => logger.warn(args),
        error: (...args) => logger.error(args)
    }
});
const server = createServer(yoga);
const wsServer = new WebSocketServer({
    server,
    path: yoga.graphqlEndpoint
});
wsServer.on('connection', (socket, request) => {
    logger.info({ event: 'ws-connection', url: request.url, headers: request.headers }, 'WebSocket connection received');
    socket.on('close', (code, reason) => {
        logger.info({ event: 'ws-close', code, reason: reason.toString() }, 'WebSocket connection closed');
    });
    socket.on('error', (error) => {
        logger.error({ event: 'ws-socket-error', error }, 'WebSocket socket error');
    });
});
wsServer.on('error', (error) => {
    logger.error({ event: 'ws-server-error', error }, 'WebSocket server error');
});
useServer({
    onSubscribe: async (ctx, _messageId, payload) => {
        logger.info({ event: 'ws-onSubscribe', payload, connectionParams: ctx.connectionParams }, 'Received subscription request');
        try {
            const fetchRequest = nodeRequestToFetch(ctx.extra.request);
            const { schema, execute, subscribe, parse, validate, contextFactory } = yoga.getEnveloped({
                ...ctx,
                request: fetchRequest,
                req: fetchRequest,
                socket: ctx.extra.socket,
                params: payload
            });
            const document = parse(payload.query ?? '');
            const validationErrors = validate(schema, document);
            if (validationErrors.length > 0) {
                return validationErrors;
            }
            const contextValue = await contextFactory();
            return {
                schema,
                operationName: payload.operationName,
                document,
                variableValues: payload.variables,
                contextValue,
                execute,
                subscribe
            };
        }
        catch (error) {
            logger.error({ event: 'ws-onSubscribe-error', error, payload }, 'Subscription setup failed');
            throw error;
        }
    },
    onError: (_ctx, _messageId, errors) => {
        logger.error({ event: 'ws-subscription-error', errors }, 'Subscription error');
    },
    onComplete: (_ctx, _messageId) => {
        logger.debug({ event: 'ws-subscription-complete', messageId: _messageId }, 'Subscription completed');
    }
}, wsServer);
server.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'GraphQL relay ready');
});
