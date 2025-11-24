import { useCallback } from 'react';
import { useCanvasSync as useCanvasSyncBase, type CanvasSyncCallbacks, type RemoteDiceData } from '../../services/CanvasSyncManager';
import { useRemoteDice, type UseRemoteDiceProps } from './useRemoteDice';
import { useSyncStatus } from './useSyncStatus';

export interface UseCanvasSyncProps extends UseRemoteDiceProps {
    // Additional props can be added here if needed
    onDiceSettle?: (diceId: string, result: number, position: [number, number, number]) => void;
}

/**
 * Enhanced canvas sync hook that combines sync management with remote dice operations
 * Provides a clean interface for components that need both sync and remote dice functionality
 */
export const useCanvasSync = ({ isInitialized, onDiceSettle }: UseCanvasSyncProps) => {
    // Use the remote dice hook
    const [remoteDice, remoteDiceOps] = useRemoteDice({ isInitialized });

    // Create canvas sync callbacks using remote dice operations
    const canvasSyncCallbacks: CanvasSyncCallbacks = {
        onDiceSpawn: useCallback((diceData: RemoteDiceData) => {
            console.log(`📡 Remote dice spawn: ${diceData.diceType} from user ${diceData.userId}`);
            remoteDiceOps.spawnRemoteDice(diceData);
        }, [remoteDiceOps]),

        onDiceThrow: useCallback((diceId: string, velocity, userId: string) => {
            console.log(`📡 Remote dice throw: ${diceId} from user ${userId}`);
            remoteDiceOps.applyRemoteDiceThrow(diceId, velocity);
        }, [remoteDiceOps]),

        onDiceSettle: useCallback((diceId: string, position, result: number, userId: string) => {
            console.log(`📡 Remote dice settle: ${diceId} = ${result} from user ${userId}`);
            remoteDiceOps.applyRemoteDiceSettle(diceId, position, result);

            // Trigger floating result overlay if callback provided
            if (onDiceSettle) {
                const overlayPosition: [number, number, number] = [position.x, position.y, position.z];
                onDiceSettle(diceId, result, overlayPosition);
            }
        }, [remoteDiceOps, onDiceSettle]),

        onDiceHighlight: useCallback((diceId: string, color: string, userId: string) => {
            console.log(`📡 Remote dice highlight: ${diceId} color ${color} from user ${userId}`);
            remoteDiceOps.applyRemoteDiceHighlight(diceId, color);
        }, [remoteDiceOps]),

        onDiceRemove: useCallback((diceId: string, userId: string) => {
            console.log(`📡 Remote dice remove: ${diceId} from user ${userId}`);
            remoteDiceOps.removeRemoteDice(diceId);
        }, [remoteDiceOps]),

        onCanvasClear: useCallback((userId: string) => {
            console.log(`📡 Remote canvas clear from user ${userId}`);
            remoteDiceOps.clearRemoteDice();
        }, [remoteDiceOps])
    };

    // Use the base canvas sync hook
    const { isConnected, error, stats, ...syncRest } = useCanvasSyncBase(canvasSyncCallbacks);

    // Use the sync status hook
    const syncStatus = useSyncStatus({ isConnected, error: error || null, stats });

    return {
        // Remote dice state and operations
        remoteDice,
        remoteDiceOps,

        // Sync status
        syncStatus,

        // Original sync data
        isConnected,
        error,
        stats,
        ...syncRest
    };
}; 