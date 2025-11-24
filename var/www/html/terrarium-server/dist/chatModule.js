import { GraphQLScalarType, Kind } from 'graphql';
export const MESSAGE_TOPIC = 'MESSAGE_STREAM';
const CHAT_TOPIC = 'CHAT_OPENED';
export function buildChatModule() {
    return {
        typeDefs: /* GraphQL */ `
      scalar DateTime

      enum ChatMode {
        terra
        external
      }

      enum ChatStatus {
        open
        closed
        error
      }

      type Chat {
        id: ID!
        mode: ChatMode!
        status: ChatStatus!
        createdAt: DateTime!
        updatedAt: DateTime!
      }

      type Message {
        id: ID!
        chatId: ID!
        sender: String!
        content: String!
        createdAt: DateTime!
      }

      type Query {
        _health: String!
        chat(id: ID!, accessCode: String!): Chat
        openChats: [Chat!]!
        messages(chatId: ID!): [Message!]!
      }

      type Mutation {
        createChat(accessCode: String!, mode: ChatMode!): Chat!
        sendVisitorMessage(chatId: ID!, content: String!, accessCode: String!): Message!
        postAgentMessage(chatId: ID!, content: String!): Message!
        closeChat(chatId: ID!, accessCode: String!): Chat
      }

      type Subscription {
        messageStream(chatId: ID!, accessCode: String): Message!
        chatOpened: Chat!
      }
    `,
        resolvers: {
            DateTime: new GraphQLScalarType({
                name: 'DateTime',
                description: 'ISO-8601 timestamp string',
                serialize(value) {
                    if (typeof value === 'string')
                        return value;
                    if (value instanceof Date)
                        return value.toISOString();
                    throw new TypeError('DateTime must serialize from string or Date');
                },
                parseValue(value) {
                    if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
                        return value;
                    }
                    throw new TypeError('DateTime must be an ISO string');
                },
                parseLiteral(ast) {
                    if (ast.kind === Kind.STRING && !Number.isNaN(Date.parse(ast.value))) {
                        return ast.value;
                    }
                    return null;
                }
            }),
            Query: {
                _health: () => 'ok',
                chat: (_root, args, ctx) => {
                    ensureVisitorAccess(args.accessCode, ctx);
                    return ctx.store.getChat(args.id) ?? null;
                },
                openChats: (_root, _args, ctx) => {
                    ensureServiceAuth(ctx);
                    return ctx.store.listOpenChats();
                },
                messages: (_root, args, ctx) => {
                    ensureServiceAuth(ctx);
                    return ctx.store.listMessages(args.chatId);
                }
            },
            Mutation: {
                createChat: async (_root, args, ctx) => {
                    ensureVisitorAccess(args.accessCode, ctx);
                    const chat = ctx.store.createChat(args.mode);
                    await ctx.pubSub.publish(CHAT_TOPIC, chat);
                    return chat;
                },
                sendVisitorMessage: (_root, args, ctx) => {
                    ensureVisitorAccess(args.accessCode, ctx);
                    const message = ctx.store.appendMessage(args.chatId, 'Visitor', args.content);
                    ctx.pubSub.publish(MESSAGE_TOPIC, message);
                    return message;
                },
                postAgentMessage: (_root, args, ctx) => {
                    ensureServiceAuth(ctx);
                    const message = ctx.store.appendMessage(args.chatId, 'Terra', args.content);
                    ctx.pubSub.publish(MESSAGE_TOPIC, message);
                    return message;
                },
                closeChat: (_root, args, ctx) => {
                    ensureVisitorAccess(args.accessCode, ctx);
                    return ctx.store.closeChat(args.chatId) ?? null;
                }
            },
            Subscription: {
                messageStream: {
                    subscribe: async (_root, args, ctx) => {
                        ensureVisitorAccess(args.accessCode ?? null, ctx);
                        const iterator = ctx.pubSub.subscribe(MESSAGE_TOPIC);
                        return filterMessages(iterator, args.chatId);
                    },
                    resolve: (payload) => payload
                },
                chatOpened: {
                    subscribe: async (_root, _args, ctx) => {
                        ensureServiceAuth(ctx);
                        return ctx.pubSub.subscribe(CHAT_TOPIC);
                    },
                    resolve: (payload) => payload
                }
            }
        }
    };
}
function ensureVisitorAccess(accessCode, ctx) {
    if (accessCode && accessCode === ctx.env.CHAT_PASSWORD) {
        return;
    }
    if (hasServiceAuth(ctx.requestHeaders, ctx.env)) {
        return;
    }
    throw new Error('Access denied');
}
function ensureServiceAuth(ctx) {
    if (!hasServiceAuth(ctx.requestHeaders, ctx.env)) {
        throw new Error('Unauthorized');
    }
}
function hasServiceAuth(headers, env) {
    const token = headers.get('x-service-token');
    return Boolean(token && token === env.SERVICE_TOKEN);
}
async function* filterMessages(iterator, chatId) {
    for await (const payload of iterator) {
        if (payload.chatId === chatId) {
            yield payload;
        }
    }
}
