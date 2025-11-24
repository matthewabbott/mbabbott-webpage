import type { CanvasEvent, CanvasDiceState, CanvasRoomState, Position, Velocity } from '../types/canvas.js';
import { CanvasEventType } from '../types/canvas.js';

export class CanvasStateManager {
    private rooms: Map<string, CanvasRoomState> = new Map();
    private eventIdCounter = 0;
    private eventSubscribers: Set<(event: CanvasEvent) => void> = new Set();

    /**
     * Get or create room state for a session
     */
    private getOrCreateRoom(roomId: string): CanvasRoomState {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                roomId,
                activeDice: new Map(),
                lastEventId: 0
            });
        }
        return this.rooms.get(roomId)!;
    }

    /**
     * Subscribe to canvas events
     */
    public subscribe(callback: (event: CanvasEvent) => void): () => void {
        this.eventSubscribers.add(callback);
        return () => {
            this.eventSubscribers.delete(callback);
        };
    }

    /**
     * Broadcast event to all subscribers
     */
    private broadcastEvent(event: CanvasEvent): void {
        this.eventSubscribers.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('Error broadcasting canvas event:', error);
            }
        });
    }

    /**
     * Generate unique event ID
     */
    private generateEventId(): string {
        return `canvas_event_${++this.eventIdCounter}_${Date.now()}`;
    }

    /**
     * Spawn dice in the canvas
     */
    public spawnDice(
        roomId: string,
        userId: string,
        diceData: {
            diceId: string;
            diceType: string;
            position: Position;
            velocity?: Velocity;
            isVirtual: boolean;
            virtualRolls?: number[];
        }
    ): CanvasEvent {
        const room = this.getOrCreateRoom(roomId);

        const diceState: CanvasDiceState = {
            id: diceData.diceId,
            diceType: diceData.diceType,
            position: diceData.position,
            velocity: diceData.velocity,
            isVirtual: diceData.isVirtual,
            virtualRolls: diceData.virtualRolls,
            userId,
            timestamp: new Date().toISOString(),
            state: 'spawning'
        };

        room.activeDice.set(diceData.diceId, diceState);

        const event: CanvasEvent = {
            id: this.generateEventId(),
            type: CanvasEventType.DICE_SPAWN,
            diceId: diceData.diceId,
            userId,
            timestamp: diceState.timestamp,
            data: {
                position: diceData.position,
                velocity: diceData.velocity,
                diceType: diceData.diceType,
                isVirtual: diceData.isVirtual,
                virtualRolls: diceData.virtualRolls
            }
        };

        this.broadcastEvent(event);
        return event;
    }

    /**
     * Apply physics throw to dice
     */
    public throwDice(
        roomId: string,
        userId: string,
        diceId: string,
        velocity: Velocity
    ): CanvasEvent | null {
        const room = this.getOrCreateRoom(roomId);
        const dice = room.activeDice.get(diceId);

        if (!dice || dice.userId !== userId) {
            return null;
        }

        dice.velocity = velocity;
        dice.state = 'throwing';
        dice.timestamp = new Date().toISOString();

        const event: CanvasEvent = {
            id: this.generateEventId(),
            type: CanvasEventType.DICE_THROW,
            diceId,
            userId,
            timestamp: dice.timestamp,
            data: {
                velocity,
                position: dice.position
            }
        };

        this.broadcastEvent(event);
        return event;
    }

    /**
     * Settle dice with final result
     */
    public settleDice(
        roomId: string,
        userId: string,
        diceId: string,
        finalPosition: Position,
        result: number
    ): CanvasEvent | null {
        const room = this.getOrCreateRoom(roomId);
        const dice = room.activeDice.get(diceId);

        if (!dice || dice.userId !== userId) {
            return null;
        }

        dice.position = finalPosition;
        dice.result = result;
        dice.state = 'settled';
        dice.timestamp = new Date().toISOString();

        const event: CanvasEvent = {
            id: this.generateEventId(),
            type: CanvasEventType.DICE_SETTLE,
            diceId,
            userId,
            timestamp: dice.timestamp,
            data: {
                position: finalPosition,
                result,
                diceType: dice.diceType,
                isVirtual: dice.isVirtual,
                virtualRolls: dice.virtualRolls
            }
        };

        this.broadcastEvent(event);
        return event;
    }

    /**
     * Highlight dice
     */
    public highlightDice(
        roomId: string,
        userId: string,
        diceId: string,
        highlightColor?: string
    ): CanvasEvent | null {
        const room = this.getOrCreateRoom(roomId);
        const dice = room.activeDice.get(diceId);

        if (!dice) {
            return null;
        }

        dice.state = 'highlighted';
        dice.timestamp = new Date().toISOString();

        const event: CanvasEvent = {
            id: this.generateEventId(),
            type: CanvasEventType.DICE_HIGHLIGHT,
            diceId,
            userId,
            timestamp: dice.timestamp,
            data: {
                highlightColor: highlightColor || '#ffff00',
                position: dice.position
            }
        };

        this.broadcastEvent(event);
        return event;
    }

    /**
     * Remove specific dice
     */
    public removeDice(
        roomId: string,
        userId: string,
        diceId: string
    ): CanvasEvent | null {
        const room = this.getOrCreateRoom(roomId);
        const dice = room.activeDice.get(diceId);

        if (!dice || dice.userId !== userId) {
            return null;
        }

        room.activeDice.delete(diceId);

        const event: CanvasEvent = {
            id: this.generateEventId(),
            type: CanvasEventType.DICE_REMOVE,
            diceId,
            userId,
            timestamp: new Date().toISOString(),
            data: {
                position: dice.position
            }
        };

        this.broadcastEvent(event);
        return event;
    }

    /**
     * Clear all dice from canvas
     */
    public clearCanvas(roomId: string, userId: string): CanvasEvent {
        const room = this.getOrCreateRoom(roomId);

        // Clear all dice
        room.activeDice.clear();

        // Create and broadcast event
        const event: CanvasEvent = {
            id: this.generateEventId(),
            type: CanvasEventType.CANVAS_CLEAR,
            diceId: 'all',
            userId,
            timestamp: new Date().toISOString(),
            data: {}
        };

        this.broadcastEvent(event);
        return event;
    }

    /**
     * Get all active dice for a room
     */
    public getActiveDice(roomId: string): CanvasDiceState[] {
        const room = this.rooms.get(roomId);
        if (!room) return [];

        return Array.from(room.activeDice.values());
    }

    /**
     * Handle user disconnection - remove their dice
     */
    public handleUserDisconnection(roomId: string, userId: string): CanvasEvent[] {
        const room = this.rooms.get(roomId);
        if (!room) return [];

        const events: CanvasEvent[] = [];
        const userDice = Array.from(room.activeDice.entries())
            .filter(([_diceId, dice]) => dice.userId === userId);

        // Remove all dice belonging to disconnected user
        userDice.forEach(([diceId, dice]) => {
            room.activeDice.delete(diceId);

            const event: CanvasEvent = {
                id: this.generateEventId(),
                type: CanvasEventType.DICE_REMOVE,
                diceId,
                userId,
                timestamp: new Date().toISOString(),
                data: {
                    position: dice.position
                }
            };

            events.push(event);
            this.broadcastEvent(event);
        });

        return events;
    }

    /**
     * Cleanup old dice (older than specified time)
     */
    public cleanupOldDice(roomId: string, maxAgeMs: number = 30 * 60 * 1000): CanvasEvent[] {
        const room = this.rooms.get(roomId);
        if (!room) return [];

        const now = Date.now();
        const events: CanvasEvent[] = [];
        const oldDice = Array.from(room.activeDice.entries())
            .filter(([_diceId, dice]) => {
                const diceAge = now - new Date(dice.timestamp).getTime();
                return diceAge > maxAgeMs;
            });

        // Remove old dice
        oldDice.forEach(([diceId, dice]) => {
            room.activeDice.delete(diceId);

            const event: CanvasEvent = {
                id: this.generateEventId(),
                type: CanvasEventType.DICE_REMOVE,
                diceId,
                userId: 'system',
                timestamp: new Date().toISOString(),
                data: {
                    position: dice.position
                }
            };

            events.push(event);
            this.broadcastEvent(event);
        });

        return events;
    }

    /**
     * Get room statistics
     */
    public getRoomStats(roomId: string): {
        totalDice: number;
        diceByUser: Record<string, number>;
        diceByState: Record<string, number>;
    } {
        const room = this.rooms.get(roomId);
        if (!room) {
            return { totalDice: 0, diceByUser: {}, diceByState: {} };
        }

        const dice = Array.from(room.activeDice.values());
        const diceByUser: Record<string, number> = {};
        const diceByState: Record<string, number> = {};

        dice.forEach(dice => {
            diceByUser[dice.userId] = (diceByUser[dice.userId] || 0) + 1;
            diceByState[dice.state] = (diceByState[dice.state] || 0) + 1;
        });

        return {
            totalDice: dice.length,
            diceByUser,
            diceByState
        };
    }
}

// Global instance
export const canvasStateManager = new CanvasStateManager(); 