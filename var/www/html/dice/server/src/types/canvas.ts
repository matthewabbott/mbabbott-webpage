// Canvas synchronization types for Phase 3
export interface Position {
    x: number;
    y: number;
    z: number;
}

export interface Velocity {
    x: number;
    y: number;
    z: number;
}

export const CanvasEventType = {
    DICE_SPAWN: 'DICE_SPAWN',
    DICE_THROW: 'DICE_THROW',
    DICE_SETTLE: 'DICE_SETTLE',
    DICE_HIGHLIGHT: 'DICE_HIGHLIGHT',
    DICE_REMOVE: 'DICE_REMOVE',
    CANVAS_CLEAR: 'CANVAS_CLEAR'
} as const;

export type CanvasEventType = typeof CanvasEventType[keyof typeof CanvasEventType];

export interface CanvasEventData {
    position?: Position;
    velocity?: Velocity;
    result?: number;
    diceType?: string;
    isVirtual?: boolean;
    virtualRolls?: number[];
    highlightColor?: string;
}

export interface CanvasEvent {
    id: string;
    type: CanvasEventType;
    diceId: string;
    userId: string;
    timestamp: string;
    data?: CanvasEventData;
}

export interface DiceRoll {
    canvasId: string;
    diceType: string;
    position?: Position;
    isVirtual: boolean;
    virtualRolls?: number[];
    result?: number;
}

export interface CanvasData {
    dice: DiceRoll[];
    events: CanvasEvent[];
}

// Canvas state management for synchronization
export interface CanvasDiceState {
    id: string;
    diceType: string;
    position: Position;
    velocity?: Velocity;
    result?: number;
    isVirtual: boolean;
    virtualRolls?: number[];
    userId: string;
    timestamp: string;
    state: 'spawning' | 'throwing' | 'rolling' | 'settled' | 'highlighted' | 'removed';
}

export interface CanvasRoomState {
    roomId: string;
    activeDice: Map<string, CanvasDiceState>;
    lastEventId: number;
}

// Canvas synchronization manager interface
export interface CanvasSyncManager {
    subscribeToEvents(): void;
    unsubscribeFromEvents(): void;
    broadcastEvent(event: Omit<CanvasEvent, 'id' | 'timestamp'>): void;
    applyRemoteEvent(event: CanvasEvent): void;
    clearCanvas(): void;
    removeDice(diceId: string): void;
    highlightDice(diceId: string, color?: string): void;
} 