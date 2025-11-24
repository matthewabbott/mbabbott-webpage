import { getSessionId } from '../../utils/sessionId';
import type { CanvasEventData } from '../../types/canvas';

// Local type definition since DiceRollingService was removed
export interface MultiRollResult {
    total: number;
    diceCount: number;
    results: Array<{ value: number; diceType: string }>;
}

export interface LocalCanvasEvent {
    type: string;
    timestamp: number;
    data: {
        rollResult?: MultiRollResult;
        playerId: string;
        playerName?: string;
        diceType?: string;
        position?: { x: number; y: number; z: number };
        diceIds?: string[];
    };
}

export interface DiceRollEvent extends LocalCanvasEvent {
    type: 'dice_roll';
    data: {
        rollResult: MultiRollResult;
        playerId: string;
        playerName: string;
    };
}

export interface DiceSpawnEvent extends LocalCanvasEvent {
    type: 'dice_spawn';
    data: {
        diceType: string;
        position: { x: number; y: number; z: number };
        playerId: string;
    };
}

export interface DiceClearEvent extends LocalCanvasEvent {
    type: 'dice_clear';
    data: {
        playerId: string;
    };
}

export interface DiceThrowEvent extends LocalCanvasEvent {
    type: 'dice_throw';
    data: {
        diceIds: string[];
        playerId: string;
    };
}

export type LocalCanvasEventType = DiceRollEvent | DiceSpawnEvent | DiceClearEvent | DiceThrowEvent;

export interface CanvasEventPayload {
    id: string;
    type: string;
    diceId: string;
    userId: string;
    timestamp: string;
    data: CanvasEventData | Record<string, unknown>;
}

/**
 * Service for handling canvas event broadcasting and synchronization
 * Extracted from sync hooks for better testability and separation of concerns
 */
export class CanvasEventService {
    private eventListeners: Map<string, ((event: LocalCanvasEventType) => void)[]> = new Map();
    private eventHistory: LocalCanvasEventType[] = [];
    private maxHistorySize: number = 100;

    /**
     * Broadcast a dice roll event to all connected players
     */
    public broadcastDiceRoll(rollResult: MultiRollResult, playerId: string, playerName: string): void {
        const event: DiceRollEvent = {
            type: 'dice_roll',
            timestamp: Date.now(),
            data: {
                rollResult,
                playerId,
                playerName
            }
        };

        this.emitEvent(event);
        this.addToHistory(event);

        console.log(`🎲 Broadcasted dice roll event: ${rollResult.total} (${rollResult.diceCount} dice) by ${playerName}`);
    }

    /**
     * Broadcast a dice spawn event to all connected players
     */
    public broadcastDiceSpawn(diceType: string, position: { x: number; y: number; z: number }, playerId: string): void {
        const event: DiceSpawnEvent = {
            type: 'dice_spawn',
            timestamp: Date.now(),
            data: {
                diceType,
                position,
                playerId
            }
        };

        this.emitEvent(event);
        this.addToHistory(event);

        console.log(`🎲 Broadcasted dice spawn event: ${diceType} at (${position.x}, ${position.y}, ${position.z}) by ${playerId}`);
    }

    /**
     * Broadcast a dice clear event to all connected players
     */
    public broadcastDiceClear(playerId: string): void {
        const event: DiceClearEvent = {
            type: 'dice_clear',
            timestamp: Date.now(),
            data: {
                playerId
            }
        };

        this.emitEvent(event);
        this.addToHistory(event);

        console.log(`🎲 Broadcasted dice clear event by ${playerId}`);
    }

    /**
     * Broadcast a dice throw event to all connected players
     */
    public broadcastDiceThrow(diceIds: string[], playerId: string): void {
        const event: DiceThrowEvent = {
            type: 'dice_throw',
            timestamp: Date.now(),
            data: {
                diceIds,
                playerId
            }
        };

        this.emitEvent(event);
        this.addToHistory(event);

        console.log(`🎲 Broadcasted dice throw event: ${diceIds.length} dice by ${playerId}`);
    }

    /**
     * Subscribe to canvas events
     */
    public addEventListener(eventType: string, callback: (event: LocalCanvasEventType) => void): void {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType)!.push(callback);
    }

    /**
     * Unsubscribe from canvas events
     */
    public removeEventListener(eventType: string, callback: (event: LocalCanvasEventType) => void): void {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Get event history
     */
    public getEventHistory(): LocalCanvasEventType[] {
        return [...this.eventHistory];
    }

    /**
     * Get events by type
     */
    public getEventsByType(eventType: string): LocalCanvasEventType[] {
        return this.eventHistory.filter(event => event.type === eventType);
    }

    /**
     * Get events by player
     */
    public getEventsByPlayer(playerId: string): LocalCanvasEventType[] {
        return this.eventHistory.filter(event => event.data.playerId === playerId);
    }

    /**
     * Clear event history
     */
    public clearHistory(): void {
        this.eventHistory = [];
    }

    /**
     * Get current session ID
     */
    public getCurrentPlayerId(): string {
        return getSessionId();
    }

    /**
     * Emit an event to all listeners
     */
    private emitEvent(event: LocalCanvasEventType): void {
        // Emit to specific event type listeners
        const typeListeners = this.eventListeners.get(event.type);
        if (typeListeners) {
            typeListeners.forEach(callback => {
                try {
                    callback(event);
                } catch (error) {
                    console.error(`Error in event listener for ${event.type}:`, error);
                }
            });
        }

        // Emit to 'all' event listeners
        const allListeners = this.eventListeners.get('all');
        if (allListeners) {
            allListeners.forEach(callback => {
                try {
                    callback(event);
                } catch (error) {
                    console.error(`Error in 'all' event listener:`, error);
                }
            });
        }
    }

    /**
     * Add event to history
     */
    private addToHistory(event: LocalCanvasEventType): void {
        this.eventHistory.push(event);

        // Trim history if it exceeds max size
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }
} 