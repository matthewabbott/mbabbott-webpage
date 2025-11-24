import { createYoga, createPubSub } from 'graphql-yoga';
import { createServer } from 'node:http';
import { v4 as uuidv4 } from 'uuid';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { RollProcessor } from './src/services/RollProcessor';
import { DiceResultManager } from './src/services/DiceResultManager';
import { canvasStateManager } from './src/services/CanvasStateManager';
import { typeDefs } from './src/graphql/schema';

// Updated interfaces to match Phase 3 schema
interface Roll {
    expression: string;
    results: number[];
    total: number;
    canvasData?: CanvasData;
}

interface CanvasData {
    dice: DiceRoll[];
    events: CanvasEvent[];
}

interface DiceRoll {
    canvasId: string;
    diceType: string;
    position?: Position;
    isVirtual: boolean;
    virtualRolls?: number[];
    result?: number;
}

interface Position {
    x: number;
    y: number;
    z: number;
}

interface CanvasEvent {
    id: string;
    type: string;
    diceId: string;
    userId: string;
    timestamp: string;
    data?: CanvasEventData;
}

interface CanvasEventData {
    position?: Position;
    velocity?: Velocity;
    result?: number;
    diceType?: string;
    isVirtual?: boolean;
    virtualRolls?: number[];
    highlightColor?: string;
}

interface Velocity {
    x: number;
    y: number;
    z: number;
}

interface Activity {
    id: string;
    type: 'ROLL' | 'SYSTEM_MESSAGE' | 'CHAT_MESSAGE';
    timestamp: string;
    user?: string;  // Optional for system messages
    message?: string;  // For system messages and chat messages
    roll?: Roll;  // For dice rolls
}

interface UserContext {
    sessionId: string;
    getUsername: () => string | undefined;
    setUsername: (username: string) => void;
    clearUsername: () => void;
    getUserColor: () => string | undefined;
    setUserColor: (color: string) => void;
}

const activeUsernames = new Set<string>();
const sessionToUsername = new Map<string, string>();
const usernameToSession = new Map<string, string>();
const sessionToColor = new Map<string, string>();

const activities: Activity[] = [];

const rollProcessor = new RollProcessor();
const diceResultManager = new DiceResultManager();
const pubsub = createPubSub();

canvasStateManager.subscribe((canvasEvent) => {
    pubsub.publish('CANVAS_EVENTS_UPDATED', canvasEvent);
    console.log(`Published canvas event: ${canvasEvent.type} for dice ${canvasEvent.diceId} by user ${canvasEvent.userId}`);
});

function sanitizeUsername(username: string): string {
    const sanitizedUser = username.trim();
    if (sanitizedUser === '') {
        return 'Anonymous';
    }

    const allowedCharsRegex = /[^a-zA-Z0-9 _'.-]/g; // Fixed: removed unnecessary escape for hyphen
    const cleanedUser = sanitizedUser.replace(allowedCharsRegex, '');

    const maxLength = 60;
    const finalUser = cleanedUser.length > maxLength ? cleanedUser.slice(0, maxLength) : cleanedUser;

    // If after all sanitization, username is empty, default to Anonymous
    if (finalUser.trim() === '') {
        return 'Anonymous';
    }

    return finalUser;
}

function validateColor(color: string): boolean {
    // Basic hex color validation - allows 3 or 6 character hex codes
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

function getActiveUsers(): Array<{ sessionId: string; username: string; color: string | undefined; isActive: boolean }> {
    const users: Array<{ sessionId: string; username: string; color: string | undefined; isActive: boolean }> = [];

    // If we didn't care about anonymous users, we could just use `activeUsernames`
    for (const sessionId of activeSessions) {
        const username = sessionToUsername.get(sessionId) || 'Anonymous';
        const color = sessionToColor.get(sessionId);

        users.push({
            sessionId,
            username: username,
            color: color,
            isActive: true
        });
    }

    return users;
}

function publishUserListUpdate() {
    const activeUsers = getActiveUsers();
    pubsub.publish('USER_LIST_CHANGED', activeUsers);
    console.log('Published user list update:', activeUsers.map(u => u.username));
}

function createRollActivity(roll: Roll, user: string): Activity {
    return {
        id: uuidv4(),
        type: 'ROLL',
        timestamp: new Date().toISOString(),
        user: user,
        roll: roll
    };
}

function createSystemMessage(message: string, user?: string): Activity {
    return {
        id: uuidv4(),
        type: 'SYSTEM_MESSAGE',
        timestamp: new Date().toISOString(),
        user: user,
        message: message
    };
}

function createChatMessage(message: string, user: string): Activity {
    return {
        id: uuidv4(),
        type: 'CHAT_MESSAGE',
        timestamp: new Date().toISOString(),
        user: user,
        message: message
    };
}

function publishActivity(activity: Activity) {
    activities.push(activity);
    pubsub.publish('ACTIVITY_ADDED', activity);
    console.log(`Published activity: ${activity.type} - ${activity.message || (activity.roll ? `${activity.user} rolled dice` : 'unknown')}`);
}

function removeUsernameSafely(username: string, sessionId: string): boolean {
    const registeredSessionId = usernameToSession.get(username);
    if (registeredSessionId === sessionId) {
        activeUsernames.delete(username);
        usernameToSession.delete(username);
        sessionToUsername.delete(sessionId);
        console.log(`Safely removed username '${username}' for session ${sessionId}, preserving color`);
        return true;
    } else if (registeredSessionId) {
        console.warn(`Username '${username}' belongs to session ${registeredSessionId}, not ${sessionId}. Skipping removal.`);
        return false;
    } else {
        console.warn(`Username '${username}' not found in usernameToSession mapping.`);
        activeUsernames.delete(username);
        sessionToUsername.delete(sessionId);
        return false;
    }
}

// Add type definitions for GraphQL resolvers
interface DiceRollData {
    canvasId: string;
    diceType: string;
    position?: Position;
    isVirtual: boolean;
    virtualRolls?: number[];
    result?: number;
}

const resolvers = {
    Query: {
        activities: () => activities,
        activeUsers: () => getActiveUsers(),
    },
    Mutation: {
        rollDice: (_parent: unknown, { expression }: { expression: string }, context: UserContext) => {
            const username = context.getUsername() || 'Anonymous';
            const sanitizedUser = sanitizeUsername(username);

            const processedRoll = rollProcessor.processRoll(expression);

            const canvasEvents: CanvasEvent[] = [];
            if (processedRoll.canvasData && processedRoll.canvasData.diceRolls.length > 0) {
                processedRoll.canvasData.diceRolls.forEach((diceRoll: DiceRollData) => {
                    diceResultManager.registerDiceRoll(
                        diceRoll.canvasId,
                        uuidv4(),
                        uuidv4(),
                        sanitizedUser,
                        context.sessionId,
                        diceRoll.diceType,
                        diceRoll.isVirtual,
                        diceRoll.result || 0,
                        diceRoll.position
                    );

                    const canvasEvent = canvasStateManager.spawnDice(
                        // TODO: implement multi-room support
                        'default-room',
                        sanitizedUser,
                        {
                            diceId: diceRoll.canvasId,
                            diceType: diceRoll.diceType,
                            position: diceRoll.position || { x: 0, y: 0, z: 0 },
                            isVirtual: diceRoll.isVirtual,
                            virtualRolls: diceRoll.virtualRolls
                        }
                    );

                    canvasEvents.push(canvasEvent);
                });
            }

            const newRoll: Roll = {
                expression,
                results: processedRoll.rolls,
                total: processedRoll.result,
                canvasData: {
                    dice: processedRoll.canvasData?.diceRolls || [],
                    events: canvasEvents
                }
            };

            const rollActivity = createRollActivity(newRoll, sanitizedUser);
            publishActivity(rollActivity);

            console.log(`Rolled dice: ${expression} for user ${sanitizedUser}. Result: ${processedRoll.result}. Canvas dice: ${processedRoll.canvasData?.diceRolls.length || 0}`);

            return newRoll;
        },
        registerUsername: (_parent: unknown, { username }: { username: string }, context: UserContext) => {
            const sanitizedUsername = sanitizeUsername(username);
            const sessionId = context.sessionId;
            console.log(`Session ${sessionId} attempting to register username: ${sanitizedUsername}`);
            console.log(`Debug - Active usernames: [${Array.from(activeUsernames).join(', ')}]`);
            console.log(`Debug - Active sessions: [${Array.from(activeSessions).join(', ')}]`);

            const currentUsername = context.getUsername();

            // if user already has a registered non-Anonymous username, unregister
            if (currentUsername && currentUsername !== 'Anonymous') {
                console.log(`Session ${sessionId} changing name from '${currentUsername}' to '${sanitizedUsername}'`);
                removeUsernameSafely(currentUsername, sessionId);
            }

            // if registering as Anonymous, always allow
            if (sanitizedUsername === 'Anonymous') {
                context.setUsername('Anonymous');
                publishUserListUpdate();
                return {
                    success: true,
                    username: 'Anonymous',
                    message: 'Registered as Anonymous.'
                };
            }

            // check if username is taken by another session
            if (activeUsernames.has(sanitizedUsername)) {
                const existingSessionId = usernameToSession.get(sanitizedUsername);

                // if the same session is re-registering the same name, allow it
                if (existingSessionId === sessionId) {
                    console.log(`Session ${sessionId} reaffirming username: ${sanitizedUsername}`);
                    return {
                        success: true,
                        username: sanitizedUsername,
                        message: 'Username already registered to your session.'
                    };
                }

                if (existingSessionId && !activeSessions.has(existingSessionId)) {
                    console.warn(`Username '${sanitizedUsername}' is registered to inactive session ${existingSessionId}. Cleaning up orphaned username.`);
                    activeUsernames.delete(sanitizedUsername);
                    usernameToSession.delete(sanitizedUsername);
                    if (sessionToUsername.get(existingSessionId) === sanitizedUsername) {
                        sessionToUsername.delete(existingSessionId);
                    }
                } else {
                    console.log(`Username '${sanitizedUsername}' is taken by session ${existingSessionId}`);
                    return {
                        success: false,
                        username: null,
                        message: `Username '${sanitizedUsername}' is already taken.`
                    };
                }
            }

            activeUsernames.add(sanitizedUsername);
            context.setUsername(sanitizedUsername);
            usernameToSession.set(sanitizedUsername, sessionId);

            console.log(`Session ${sessionId} registered username: ${sanitizedUsername}`);

            // Publish username change activity
            if (currentUsername && currentUsername !== 'Anonymous' && currentUsername !== sanitizedUsername) {
                // Named user changing to different named user
                const systemMessage = createSystemMessage(`${currentUsername} changed their name to ${sanitizedUsername}`);
                publishActivity(systemMessage);
            } else if (currentUsername === 'Anonymous') {
                // Anonymous user registering a real name - show as registration
                const systemMessage = createSystemMessage(`Anonymous registered as ${sanitizedUsername}`);
                publishActivity(systemMessage);
            }

            publishUserListUpdate();

            return {
                success: true,
                username: sanitizedUsername,
                message: 'Username registered successfully.'
            };
        },
        setUserColor: (_parent: unknown, { color }: { color: string }, context: UserContext) => {
            const sessionId = context.sessionId;
            console.log(`Session ${sessionId} attempting to set user color: ${color}`);

            // Validate color format
            if (!validateColor(color)) {
                return {
                    success: false,
                    color: null,
                    message: 'Invalid color format. Please use a valid hex color (e.g., #FF0000).'
                };
            }

            const currentColor = context.getUserColor();
            if (currentColor === color) {
                return {
                    success: true,
                    color: currentColor,
                    message: 'Color is already set to the specified color.'
                };
            }

            context.setUserColor(color);
            sessionToColor.set(sessionId, color);

            console.log(`Session ${sessionId} updated user color to: ${color}`);

            // Publish color change activity only for users with registered usernames (not Anonymous)
            const username = context.getUsername();
            if (currentColor && currentColor !== color && username && username !== 'Anonymous') {
                const systemMessage = createSystemMessage(`${username} changed their color`);
                publishActivity(systemMessage);
            }

            publishUserListUpdate();

            return {
                success: true,
                color: color,
                message: 'User color updated successfully.'
            };
        },
        sendChatMessage: (_parent: unknown, { message }: { message: string }, context: UserContext) => {
            const username = context.getUsername() || 'Anonymous';
            const trimmedMessage = message.trim();

            if (!trimmedMessage) {
                throw new Error('Message cannot be empty');
            }

            const maxLength = 1000;
            const finalMessage = trimmedMessage.length > maxLength
                ? trimmedMessage.slice(0, maxLength)
                : trimmedMessage;

            const chatActivity = createChatMessage(finalMessage, username);
            publishActivity(chatActivity);

            console.log(`Chat message from ${username}: ${finalMessage}`);

            return chatActivity;
        }
    },
    Subscription: {
        activityAdded: {
            subscribe: () => pubsub.subscribe('ACTIVITY_ADDED'),
            resolve: (payload: Activity) => payload,
        },
        userListChanged: {
            subscribe: () => pubsub.subscribe('USER_LIST_CHANGED'),
            resolve: (payload: Array<{ sessionId: string; username: string; color: string | undefined; isActive: boolean }>) => payload,
        },
        canvasEventsUpdated: {
            subscribe: () => pubsub.subscribe('CANVAS_EVENTS_UPDATED'),
            resolve: (payload: CanvasEvent[]) => payload,
        },
    },
};

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});

function createUserContext(sessionId: string): UserContext {
    return {
        sessionId,
        getUsername: () => sessionToUsername.get(sessionId),
        setUsername: (username: string) => {
            sessionToUsername.set(sessionId, username);
        },
        clearUsername: () => {
            const username = sessionToUsername.get(sessionId);
            if (username && username !== 'Anonymous') {
                activeUsernames.delete(username);
                usernameToSession.delete(username);
                console.log(`Cleared username '${username}' for session ${sessionId}`);
            }
            sessionToUsername.delete(sessionId);
            sessionToColor.delete(sessionId);
        },
        getUserColor: () => sessionToColor.get(sessionId),
        setUserColor: (color: string) => {
            sessionToColor.set(sessionId, color);
        }
    };
}

const yoga = createYoga({
    schema,
    graphqlEndpoint: '/dice/graphql',
    context: ({ request }) => {
        // Extract session ID from request headers or generate new one if not provided
        const sessionId = request.headers.get('x-session-id') || uuidv4();
        console.log(`HTTP request from session: ${sessionId}`);
        return createUserContext(sessionId);
    }
});

// HTTP
const server = createServer(yoga);

// WebSocket
const wsServer = new WebSocketServer({
    server, // same HTTP server
    path: '/dice/graphql',
});

// connection tracking
const activeSessions = new Set<string>();
const announcedSessions = new Set<string>(); // Track which sessions have been announced

wsServer.on('connection', (socket, _request) => {
    console.log(`Raw WebSocket connection received. Total connections: ${wsServer.clients.size}`);

    socket.on('close', (code, reason) => {
        console.log(`Raw WebSocket close event. Code: ${code}, Reason: ${Buffer.from(reason).toString()}`);
        console.log(`Remaining connections: ${wsServer.clients.size}`);
    });
});

useServer({
    schema,
    context: (ctx) => {
        // Extract session ID from connection params or generate new one if not provided
        const sessionId = ctx.connectionParams?.sessionId as string || uuidv4();
        console.log(`WebSocket connection established for session: ${sessionId}`);
        activeSessions.add(sessionId);
        console.log(`Active sessions: ${Array.from(activeSessions).join(', ')}`);

        if (!sessionToUsername.has(sessionId)) {
            sessionToUsername.set(sessionId, 'Anonymous');
            console.log(`Set default username 'Anonymous' for new session ${sessionId}`);
        }

        // Assign a white color to new users (Anonymous default)
        if (!sessionToColor.has(sessionId)) {
            const defaultColor = '#ffffff';
            sessionToColor.set(sessionId, defaultColor);
            console.log(`Assigned default white color ${defaultColor} to new session ${sessionId}`);
        }

        // Delay user list update to ensure client subscriptions are ready
        // Also publish a system message for new user joins
        setTimeout(() => {
            const username = sessionToUsername.get(sessionId) || 'Anonymous';

            // Only publish join message for sessions that haven't been announced yet
            if (!announcedSessions.has(sessionId)) {
                console.log(`Publishing join message for NEW session ${sessionId} (${username})`);
                console.log(`Current active sessions: [${Array.from(activeSessions).join(', ')}]`);
                console.log(`Current announced sessions: [${Array.from(announcedSessions).join(', ')}]`);

                const systemMessage = createSystemMessage(`${username} joined the room`);
                publishActivity(systemMessage);
                announcedSessions.add(sessionId);
            } else {
                console.log(`Skipping join message for EXISTING session ${sessionId} (${username}) - already announced`);
            }

            publishUserListUpdate();
            console.log(`Delayed user list update published for session ${sessionId} (${username})`);
        }, 100); // 100ms delay to ensure client subscriptions are established

        return createUserContext(sessionId);
    },
    onDisconnect: (ctx, code, reason) => {
        console.log(`onDisconnect triggered. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
        console.log(`onDisconnect ctx details: ${JSON.stringify({
            connectionParams: ctx.connectionParams,
            hasExtra: !!ctx.extra,
            extraKeys: ctx.extra ? Object.keys(ctx.extra) : []
        }, null, 2)}`);

        // Use the session ID to clean up when WebSocket disconnects
        if (ctx.extra && ctx.extra.context) {
            const context = ctx.extra.context as UserContext;
            const username = context.getUsername();
            const sessionId = context.sessionId;

            activeSessions.delete(sessionId);
            announcedSessions.delete(sessionId); // Clean up announced sessions tracking
            console.log(`Session removed from active sessions. Remaining: ${Array.from(activeSessions).join(', ')}`);

            if (username && username !== 'Anonymous') {
                console.log(`Session ${sessionId} disconnected with username '${username}'. Removing from active usernames.`);
                // Publish departure message for named users
                const systemMessage = createSystemMessage(`${username} left the room`);
                publishActivity(systemMessage);
                removeUsernameSafely(username, sessionId);
            } else {
                sessionToUsername.delete(sessionId);
                sessionToColor.delete(sessionId);
            }
            console.log(`WebSocket disconnected for session ${sessionId}. Code: ${code}, Reason: ${reason || 'No reason provided'}`);

            publishUserListUpdate();
        } else {
            console.log(`Could not access context in onDisconnect. ctx.extra: ${ctx.extra ? 'exists' : 'undefined'}`);

            // Try to find session ID in connection params
            const sessionId = ctx.connectionParams?.sessionId as string;
            if (sessionId) {
                console.log(`Found sessionId ${sessionId} in connectionParams, attempting cleanup.`);
                const username = sessionToUsername.get(sessionId);
                if (username && username !== 'Anonymous') {
                    console.log(`Cleanup for session ${sessionId} with username '${username}'.`);
                    // Publish departure message for named users
                    const systemMessage = createSystemMessage(`${username} left the room`);
                    publishActivity(systemMessage);
                    removeUsernameSafely(username, sessionId);
                } else {
                    sessionToUsername.delete(sessionId);
                    sessionToColor.delete(sessionId);
                }
                activeSessions.delete(sessionId);
                announcedSessions.delete(sessionId); // Clean up announced sessions tracking

                publishUserListUpdate();
            } else {
                console.log('Could not find sessionId in connectionParams.');
            }
        }
    }
}, wsServer);

server.listen(4000, () => {
    console.info('Server is running on http://localhost:4000/dice/graphql');
});