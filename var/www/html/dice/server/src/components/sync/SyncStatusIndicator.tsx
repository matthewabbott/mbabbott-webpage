import React from 'react';
import type { SyncStatus } from '../../hooks/sync/useSyncStatus';

export interface SyncStatusIndicatorProps {
    status: SyncStatus;
    isFullScreen?: boolean;
    stats?: {
        totalDice: number;
        localDice: number;
        remoteDice: number;
        diceByUser: Record<string, number>;
        diceByType: Record<string, number>;
    };
}

/**
 * SyncStatusIndicator Component
 * Displays the current synchronization status with visual indicators
 * Extracted from DiceCanvas for better separation of concerns
 */
export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
    status,
    isFullScreen: _isFullScreen = false,
    stats
}) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'connected':
                return {
                    className: 'bg-green-600 text-white',
                    icon: '📡',
                    text: 'Synced'
                };
            case 'connecting':
                return {
                    className: 'bg-yellow-600 text-white',
                    icon: '📡',
                    text: 'Connecting...'
                };
            case 'error':
                return {
                    className: 'bg-red-600 text-white',
                    icon: '📡',
                    text: 'Offline'
                };
            default:
                return {
                    className: 'bg-gray-600 text-white',
                    icon: '📡',
                    text: 'Unknown'
                };
        }
    };

    const statusConfig = getStatusConfig();

    return (
        <div
            className={`px-2 py-1 rounded text-xs font-mono ${statusConfig.className}`}
            title={stats ? `Users: ${Object.keys(stats.diceByUser).length}` : undefined}
        >
            {statusConfig.icon} {statusConfig.text}
        </div>
    );
}; 