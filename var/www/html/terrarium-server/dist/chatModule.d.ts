import { GraphQLScalarType } from 'graphql';
import type { Env } from './env.js';
import type { ChatRecord, InMemoryChatStore, MessageRecord } from './store.js';
export declare const MESSAGE_TOPIC = "MESSAGE_STREAM";
export interface PubSubLike {
    publish: (event: string, payload: unknown) => Promise<void> | void;
    subscribe: (event: string) => AsyncIterable<unknown>;
}
export interface YogaContext {
    store: InMemoryChatStore;
    env: Env;
    pubSub: PubSubLike;
    requestHeaders: Headers;
}
export declare function buildChatModule(): {
    typeDefs: string;
    resolvers: {
        DateTime: GraphQLScalarType<string | null, string>;
        Query: {
            _health: () => string;
            chat: (_root: unknown, args: {
                id: string;
                accessCode: string;
            }, ctx: YogaContext) => ChatRecord | null;
            openChats: (_root: unknown, _args: unknown, ctx: YogaContext) => ChatRecord[];
            messages: (_root: unknown, args: {
                chatId: string;
            }, ctx: YogaContext) => MessageRecord[];
        };
        Mutation: {
            createChat: (_root: unknown, args: {
                accessCode: string;
                mode: "terra" | "external";
            }, ctx: YogaContext) => Promise<ChatRecord>;
            sendVisitorMessage: (_root: unknown, args: {
                chatId: string;
                content: string;
                accessCode: string;
            }, ctx: YogaContext) => MessageRecord;
            postAgentMessage: (_root: unknown, args: {
                chatId: string;
                content: string;
            }, ctx: YogaContext) => MessageRecord;
            closeChat: (_root: unknown, args: {
                chatId: string;
                accessCode: string;
            }, ctx: YogaContext) => ChatRecord | null;
        };
        Subscription: {
            messageStream: {
                subscribe: (_root: unknown, args: {
                    chatId: string;
                    accessCode?: string | null;
                }, ctx: YogaContext) => Promise<AsyncGenerator<MessageRecord, void, unknown>>;
                resolve: (payload: MessageRecord) => MessageRecord;
            };
            chatOpened: {
                subscribe: (_root: unknown, _args: unknown, ctx: YogaContext) => Promise<AsyncIterable<ChatRecord>>;
                resolve: (payload: ChatRecord) => ChatRecord;
            };
        };
    };
};
//# sourceMappingURL=chatModule.d.ts.map