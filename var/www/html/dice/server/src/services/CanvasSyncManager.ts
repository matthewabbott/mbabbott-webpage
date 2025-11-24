import { useSubscription } from '@apollo/client';
import { useCallback, useRef, useEffect } from 'react';
import type { CanvasEvent, Position, Velocity } from '../types/canvas.js';
import { CanvasEventType } from '../types/canvas.js';
import { CANVAS_EVENTS_SUBSCRIPTION } from '../graphql/operations.js';
import { getSessionId } from '../utils/sessionId.js';

export interface SyncConfiguration {
    mode: 'full' | 'result'; // Full sync vs result-only sync
    enablePhysicsSync: boolean; // Whether to sync intermediate physics
    enableHighlighting: boolean; // Whether to sync highlighting
    maxEventHistory: number; // Maximum events to keep in history
    conflictResolution: 'latest' | 'owner'; // How to resolve conflicts
}

export const DEFAULT_SYNC_CONFIG: SyncConfiguration = {
    mode: 'result', // Start with result-only sync (recommended)
    enablePhysicsSync: false, // Disable intermediate physics sync
    enableHighlighting: true, // Enable highlighting sync
    maxEventHistory: 100, // Keep last 100 events
    conflictResolution: 'owner' // Owner takes precedence
};

export interface RemoteDiceData {
    canvasId: string;
    diceType: string;
    position: Position;
    velocity?: Velocity;
    result?: number;
    isVirtual: boolean;
    virtualRolls?: number[];
    userId: string;
    isLocal: boolean; // Whether this dice belongs to the current user
}

export interface CanvasSyncCallbacks {
    onDiceSpawn: (diceData: RemoteDiceData) => void;
    onDiceThrow: (diceId: string, velocity: Velocity, userId: string) => void;
    onDiceSettle: (diceId: string, position: Position, result: number, userId: string) => void;
    onDiceHighlight: (diceId: string, color: string, userId: string) => void;
    onDiceRemove: (diceId: string, userId: string) => void;
    onCanvasClear: (userId: string) => void;
}

export class CanvasSyncManager {
    private callbacks: CanvasSyncCallbacks | null = null;
    private currentSessionId: string;
    private activeDice: Map<string, RemoteDiceData> = new Map();
    private eventHistory: CanvasEvent[] = [];
    private config: SyncConfiguration;

    constructor(config: SyncConfiguration = DEFAULT_SYNC_CONFIG) {
        this.currentSessionId = getSessionId();
        this.config = { ...config };
    }

    /**
     * Update sync configuration
     */
    public updateConfig(newConfig: Partial<SyncConfiguration>): void {
        this.config = { ...this.config, ...newConfig };
        console.log('📡 Updated sync configuration:', this.config);
    }

    /**
     * Get current sync configuration
     */
    public getConfig(): SyncConfiguration {
        return { ...this.config };
    }

    /**
     * Set callbacks for canvas events
     */
    public setCallbacks(callbacks: CanvasSyncCallbacks): void {
        this.callbacks = callbacks;
    }

    /**
     * Process incoming canvas event from GraphQL subscription
     */
    public processCanvasEvent(event: CanvasEvent): void {
        // Add to event history
        this.eventHistory.push(event);
        if (this.eventHistory.length > this.config.maxEventHistory) {
            this.eventHistory.shift();
        }

        // Determine if this is a local event (from current user)
        const isLocal = event.userId === this.currentSessionId;

        console.log(`📡 Received canvas event: ${event.type} for dice ${event.diceId} from ${isLocal ? 'local' : 'remote'} user ${event.userId}`);

        // Apply selective synchronization based on configuration
        if (!this.shouldProcessEvent(event, isLocal)) {
            console.log(`📡 Skipping event ${event.type} due to sync configuration`);
            return;
        }

        // Process event based on type
        switch (event.type as CanvasEventType) {
            case 'DICE_SPAWN':
                this.handleDiceSpawn(event, isLocal);
                break;
            case 'DICE_THROW':
                this.handleDiceThrow(event, isLocal);
                break;
            case 'DICE_SETTLE':
                this.handleDiceSettle(event, isLocal);
                break;
            case 'DICE_HIGHLIGHT':
                this.handleDiceHighlight(event, isLocal);
                break;
            case 'DICE_REMOVE':
                this.handleDiceRemove(event, isLocal);
                break;
            case 'CANVAS_CLEAR':
                this.handleCanvasClear(event, isLocal);
                break;
            default:
                console.warn(`Unknown canvas event type: ${event.type}`);
        }
    }

    /**
     * Determine if an event should be processed based on sync configuration
     */
    private shouldProcessEvent(event: CanvasEvent, isLocal: boolean): boolean {
        // Always process local events for state tracking
        if (isLocal) {
            return true;
        }

        // Check sync mode
        if (this.config.mode === 'result') {
            // Result-only sync: only process spawn and settle events
            const allowedEvents: CanvasEventType[] = [
                CanvasEventType.DICE_SPAWN,
                CanvasEventType.DICE_SETTLE,
                CanvasEventType.DICE_REMOVE,
                CanvasEventType.CANVAS_CLEAR
            ];
            if (!allowedEvents.includes(event.type as CanvasEventType)) {
                return false;
            }
        }

        // Check physics sync setting
        if (!this.config.enablePhysicsSync && event.type === CanvasEventType.DICE_THROW) {
            return false;
        }

        // Check highlighting setting
        if (!this.config.enableHighlighting && event.type === CanvasEventType.DICE_HIGHLIGHT) {
            return false;
        }

        return true;
    }

    /**
     * Handle dice spawn event
     */
    private handleDiceSpawn(event: CanvasEvent, isLocal: boolean): void {
        if (!this.callbacks || !event.data) return;

        const diceData: RemoteDiceData = {
            canvasId: event.diceId,
            diceType: event.data.diceType || 'd6',
            position: event.data.position || { x: 0, y: 5, z: 0 },
            velocity: event.data.velocity,
            result: event.data.result,
            isVirtual: event.data.isVirtual || false,
            virtualRolls: event.data.virtualRolls,
            userId: event.userId,
            isLocal
        };

        // Store in active dice
        this.activeDice.set(event.diceId, diceData);

        // Only apply remote dice to avoid duplicates
        if (!isLocal) {
            this.callbacks.onDiceSpawn(diceData);
        }
    }

    /**
     * Handle dice throw event
     */
    private handleDiceThrow(event: CanvasEvent, _isLocal: boolean): void {
        if (!this.callbacks || !event.data?.velocity) return;

        // Update dice data
        const diceData = this.activeDice.get(event.diceId);
        if (diceData) {
            diceData.velocity = event.data.velocity;
        }

        // Apply throw to canvas (both local and remote for physics sync)
        this.callbacks.onDiceThrow(event.diceId, event.data.velocity, event.userId);
    }

    /**
     * Handle dice settle event
     */
    private handleDiceSettle(event: CanvasEvent, _isLocal: boolean): void {
        if (!this.callbacks || !event.data?.position || event.data.result === undefined) return;

        // Update dice data
        const diceData = this.activeDice.get(event.diceId);
        if (diceData) {
            diceData.position = event.data.position;
            diceData.result = event.data.result;
        }

        // Apply settle to canvas
        this.callbacks.onDiceSettle(event.diceId, event.data.position, event.data.result, event.userId);
    }

    /**
     * Handle dice highlight event
     */
    private handleDiceHighlight(event: CanvasEvent, _isLocal: boolean): void {
        if (!this.callbacks || !event.data?.highlightColor) return;

        this.callbacks.onDiceHighlight(event.diceId, event.data.highlightColor, event.userId);
    }

    /**
     * Handle dice remove event
     */
    private handleDiceRemove(event: CanvasEvent, isLocal: boolean): void {
        if (!this.callbacks) return;

        // Remove from active dice
        this.activeDice.delete(event.diceId);

        // Only apply remote removals to avoid duplicates
        if (!isLocal) {
            this.callbacks.onDiceRemove(event.diceId, event.userId);
        }
    }

    /**
     * Handle canvas clear event
     */
    private handleCanvasClear(event: CanvasEvent, isLocal: boolean): void {
        if (!this.callbacks) return;

        // Clear active dice
        this.activeDice.clear();

        // Only apply remote clears to avoid duplicates
        if (!isLocal) {
            this.callbacks.onCanvasClear(event.userId);
        }
    }

    /**
     * Get all active dice
     */
    public getActiveDice(): RemoteDiceData[] {
        return Array.from(this.activeDice.values());
    }

    /**
     * Get dice by ID
     */
    public getDice(diceId: string): RemoteDiceData | undefined {
        return this.activeDice.get(diceId);
    }

    /**
     * Get dice by user
     */
    public getDiceByUser(userId: string): RemoteDiceData[] {
        return Array.from(this.activeDice.values()).filter(dice => dice.userId === userId);
    }

    /**
     * Get local dice (belonging to current user)
     */
    public getLocalDice(): RemoteDiceData[] {
        return this.getDiceByUser(this.currentSessionId);
    }

    /**
     * Get remote dice (belonging to other users)
     */
    public getRemoteDice(): RemoteDiceData[] {
        return Array.from(this.activeDice.values()).filter(dice => dice.userId !== this.currentSessionId);
    }

    /**
     * Get event history
     */
    public getEventHistory(): CanvasEvent[] {
        return [...this.eventHistory];
    }

    /**
     * Get statistics
     */
    public getStats(): {
        totalDice: number;
        localDice: number;
        remoteDice: number;
        diceByUser: Record<string, number>;
        diceByType: Record<string, number>;
    } {
        const allDice = Array.from(this.activeDice.values());
        const diceByUser: Record<string, number> = {};
        const diceByType: Record<string, number> = {};

        allDice.forEach(dice => {
            diceByUser[dice.userId] = (diceByUser[dice.userId] || 0) + 1;
            diceByType[dice.diceType] = (diceByType[dice.diceType] || 0) + 1;
        });

        return {
            totalDice: allDice.length,
            localDice: this.getLocalDice().length,
            remoteDice: this.getRemoteDice().length,
            diceByUser,
            diceByType
        };
    }

    /**
     * Clear all data (for cleanup)
     */
    public clear(): void {
        this.activeDice.clear();
        this.eventHistory = [];
    }
}

/**
 * React hook for canvas synchronization
 */
export function useCanvasSync(callbacks: CanvasSyncCallbacks, config?: Partial<SyncConfiguration>) {
    const syncManagerRef = useRef<CanvasSyncManager | null>(null);

    // Initialize sync manager
    useEffect(() => {
        if (!syncManagerRef.current) {
            const finalConfig = { ...DEFAULT_SYNC_CONFIG, ...config };
            syncManagerRef.current = new CanvasSyncManager(finalConfig);
        }
        syncManagerRef.current.setCallbacks(callbacks);
    }, [callbacks, config]);

    // Subscribe to canvas events
    const { loading, error } = useSubscription<{ canvasEventsUpdated: CanvasEvent }>(
        CANVAS_EVENTS_SUBSCRIPTION,
        {
            onData: ({ data: subscriptionData }) => {
                if (subscriptionData?.data?.canvasEventsUpdated && syncManagerRef.current) {
                    syncManagerRef.current.processCanvasEvent(subscriptionData.data.canvasEventsUpdated);
                }
            },
            onError: (error) => {
                console.error('Canvas sync subscription error:', error);
            }
        }
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (syncManagerRef.current) {
                syncManagerRef.current.clear();
            }
        };
    }, []);

    // Configuration update function
    const updateSyncConfig = useCallback((newConfig: Partial<SyncConfiguration>) => {
        if (syncManagerRef.current) {
            syncManagerRef.current.updateConfig(newConfig);
        }
    }, []);

    return {
        syncManager: syncManagerRef.current,
        isConnected: !loading && !error,
        error,
        updateSyncConfig,
        config: syncManagerRef.current?.getConfig() || DEFAULT_SYNC_CONFIG,
        stats: syncManagerRef.current?.getStats() || {
            totalDice: 0,
            localDice: 0,
            remoteDice: 0,
            diceByUser: {},
            diceByType: {}
        }
    };
} 