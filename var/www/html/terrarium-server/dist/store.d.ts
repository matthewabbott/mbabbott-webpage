export type ChatMode = 'terra' | 'external';
export type ChatStatus = 'open' | 'closed' | 'error';
export interface ChatRecord {
    id: string;
    mode: ChatMode;
    status: ChatStatus;
    createdAt: string;
    updatedAt: string;
}
export interface MessageRecord {
    id: string;
    chatId: string;
    sender: string;
    content: string;
    createdAt: string;
}
export interface StoreOptions {
    ttlHours: number;
}
export declare class InMemoryChatStore {
    private readonly chats;
    private readonly messages;
    private readonly ttlMs;
    constructor(options: StoreOptions);
    createChat(mode: ChatMode): ChatRecord;
    getChat(id: string): ChatRecord | undefined;
    appendMessage(chatId: string, sender: string, content: string): MessageRecord;
    closeChat(chatId: string, status?: ChatStatus): ChatRecord | undefined;
    listMessages(chatId: string): MessageRecord[];
    listOpenChats(): ChatRecord[];
    private prune;
    private isExpired;
    private deleteChat;
}
//# sourceMappingURL=store.d.ts.map