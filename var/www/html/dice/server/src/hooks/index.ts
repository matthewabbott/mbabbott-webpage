// Canvas and interaction hooks
export { useDiceInteraction } from './useDiceInteraction';
export { usePhysicsSync } from './usePhysicsSync';
export { useCanvasSync } from './sync/useCanvasSync';

// Control hooks
export { useCameraControls } from './controls';

// Highlighting and UI hooks
export { useHighlighting } from './useHighlighting';

// Sync hooks
export { useSyncStatus } from './sync/useSyncStatus';

// Export types
export type {
    DiceInteractionState,
    DiceInteractionHandlers,
    UseDiceInteractionProps
} from './useDiceInteraction';

export type {
    UsePhysicsSyncProps
} from './usePhysicsSync';

export type {
    UseCanvasSyncProps
} from './sync/useCanvasSync';

export type {
    CameraControlsState,
    CameraControlsOperations,
    CameraControlsProps
} from './controls';

export type {
    SyncStatus
} from './sync/useSyncStatus'; 