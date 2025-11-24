import { randomUUID } from 'crypto';
export class InMemoryChatStore {
    chats = new Map();
    messages = new Map();
    ttlMs;
    constructor(options) {
        this.ttlMs = options.ttlHours * 60 * 60 * 1000;
    }
    createChat(mode) {
        const now = new Date().toISOString();
        const chat = {
            id: randomUUID(),
            mode,
            status: 'open',
            createdAt: now,
            updatedAt: now
        };
        this.chats.set(chat.id, chat);
        this.messages.set(chat.id, []);
        this.prune();
        return chat;
    }
    getChat(id) {
        const chat = this.chats.get(id);
        if (!chat)
            return undefined;
        if (this.isExpired(chat)) {
            this.deleteChat(id);
            return undefined;
        }
        return chat;
    }
    appendMessage(chatId, sender, content) {
        const chat = this.getChat(chatId);
        if (!chat) {
            throw new Error('Chat not found or expired');
        }
        const message = {
            id: randomUUID(),
            chatId,
            sender,
            content,
            createdAt: new Date().toISOString()
        };
        const list = this.messages.get(chatId);
        if (!list) {
            throw new Error('Message buffer missing for chat');
        }
        list.push(message);
        chat.updatedAt = message.createdAt;
        return message;
    }
    closeChat(chatId, status = 'closed') {
        const chat = this.getChat(chatId);
        if (!chat)
            return undefined;
        chat.status = status;
        chat.updatedAt = new Date().toISOString();
        return chat;
    }
    listMessages(chatId) {
        return [...(this.messages.get(chatId) ?? [])];
    }
    listOpenChats() {
        return [...this.chats.values()].filter((chat) => chat.status === 'open');
    }
    prune() {
        const now = Date.now();
        for (const [id, chat] of this.chats.entries()) {
            if (now - Date.parse(chat.updatedAt) > this.ttlMs) {
                this.deleteChat(id);
            }
        }
    }
    isExpired(chat) {
        return Date.now() - Date.parse(chat.updatedAt) > this.ttlMs;
    }
    deleteChat(chatId) {
        this.chats.delete(chatId);
        this.messages.delete(chatId);
    }
}
