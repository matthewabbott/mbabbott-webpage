import { useState, useEffect } from 'react';

export type SyncStatus = 'connecting' | 'connected' | 'error';

export interface SyncStatusState {
    status: SyncStatus;
    isConnected: boolean;
    error: Error | null;
    stats?: {
        totalDice: number;
        localDice: number;
        remoteDice: number;
        diceByUser: Record<string, number>;
        diceByType: Record<string, number>;
    };
}

export interface UseSyncStatusProps {
    isConnected: boolean;
    error: Error | null;
    stats?: SyncStatusState['stats'];
}

/**
 * Custom hook for managing sync connection status
 * Extracted from DiceCanvas for better separation of concerns
 */
export const useSyncStatus = ({ isConnected, error, stats }: UseSyncStatusProps): SyncStatusState => {
    const [status, setStatus] = useState<SyncStatus>('connecting');

    // Update sync status based on connection state
    useEffect(() => {
        if (error) {
            setStatus('error');
        } else if (isConnected) {
            setStatus('connected');
        } else {
            setStatus('connecting');
        }
    }, [isConnected, error]);

    return {
        status,
        isConnected,
        error,
        stats
    };
}; 