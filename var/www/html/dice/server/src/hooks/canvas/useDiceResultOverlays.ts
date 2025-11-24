import { useState, useCallback } from 'react';

export interface DiceResultOverlay {
    diceId: string;
    result: number;
    position: [number, number, number];
    isVisible: boolean;
    timestamp: number;
    originalPosition?: [number, number, number]; // Store original position for distance checks
    rollId?: string; // For grouping dice from the same roll
    isGroupSum?: boolean; // Whether this shows a sum for multiple dice
}

/**
 * Hook for managing floating result number overlays
 * Handles showing, hiding, and cleaning up result overlays for dice
 */
export const useDiceResultOverlays = () => {
    const [overlays, setOverlays] = useState<Map<string, DiceResultOverlay>>(new Map());

    /**
     * Show a result overlay for a specific dice (only if not already visible)
     */
    const showResultOverlay = useCallback((
        diceId: string,
        result: number,
        position: [number, number, number],
        rollId?: string,
        isGroupSum?: boolean
    ) => {
        setOverlays(prev => {
            const existing = prev.get(diceId);

            // Only update if overlay doesn't exist or is not visible
            if (!existing || !existing.isVisible) {
                const newOverlays = new Map(prev);
                newOverlays.set(diceId, {
                    diceId,
                    result,
                    position,
                    isVisible: true,
                    timestamp: Date.now(),
                    originalPosition: [...position] as [number, number, number],
                    rollId,
                    isGroupSum
                });

                console.log(`🎲 Showing ${isGroupSum ? 'group sum' : 'result'} overlay for dice ${diceId}: ${result}`);
                return newOverlays;
            }

            return prev;
        });
    }, []);

    /**
     * Show group sum overlay for multiple dice from the same roll
     */
    const showGroupSumOverlay = useCallback((
        diceIds: string[],
        totalSum: number,
        rollId: string,
        getDicePosition: (diceId: string) => [number, number, number] | null
    ) => {
        if (diceIds.length === 0) return;

        // Use the first dice position for the group sum overlay
        const primaryDiceId = diceIds[0];
        const position = getDicePosition(primaryDiceId);

        if (position) {
            // Remove individual overlays for all dice in the group
            setOverlays(prev => {
                const newOverlays = new Map(prev);

                // Remove individual overlays
                diceIds.forEach(diceId => {
                    newOverlays.delete(diceId);
                });

                // Add group sum overlay on the primary dice
                newOverlays.set(primaryDiceId, {
                    diceId: primaryDiceId,
                    result: totalSum,
                    position,
                    isVisible: true,
                    timestamp: Date.now(),
                    originalPosition: [...position] as [number, number, number],
                    rollId,
                    isGroupSum: true
                });

                return newOverlays;
            });

            console.log(`🎲 Showing group sum overlay (${diceIds.length} dice): ${totalSum}`);
        }
    }, []);

    /**
     * Update the position of an existing overlay (for following dice)
     */
    const updateOverlayPosition = useCallback((
        diceId: string,
        newPosition: [number, number, number]
    ) => {
        setOverlays(prev => {
            const overlay = prev.get(diceId);
            if (overlay && overlay.isVisible) {
                const newOverlays = new Map(prev);
                newOverlays.set(diceId, {
                    ...overlay,
                    position: [newPosition[0], newPosition[1] + 2, newPosition[2]] // Keep 2 units above dice
                });
                return newOverlays;
            }
            return prev;
        });
    }, []);

    /**
     * Check if dice has moved too far from original position and hide overlay
     */
    const checkDistanceAndHide = useCallback((
        diceId: string,
        currentPosition: [number, number, number],
        maxDistance: number = 3
    ) => {
        setOverlays(prev => {
            const overlay = prev.get(diceId);
            if (!overlay || !overlay.originalPosition || !overlay.isVisible) {
                return prev;
            }

            const [origX, origY, origZ] = overlay.originalPosition;
            const [currX, currY, currZ] = currentPosition;

            const distance = Math.sqrt(
                Math.pow(currX - origX, 2) +
                Math.pow(currY - origY, 2) +
                Math.pow(currZ - origZ, 2)
            );

            if (distance > maxDistance) {
                console.log(`🎲 Hiding overlay for dice ${diceId} - moved too far (${distance.toFixed(2)} > ${maxDistance})`);
                const newOverlays = new Map(prev);
                newOverlays.set(diceId, { ...overlay, isVisible: false });
                return newOverlays;
            }

            return prev;
        });
    }, []);

    /**
     * Hide a result overlay for a specific dice
     */
    const hideResultOverlay = useCallback((diceId: string) => {
        setOverlays(prev => {
            const overlay = prev.get(diceId);
            if (overlay && overlay.isVisible) {
                const newOverlays = new Map(prev);
                newOverlays.set(diceId, { ...overlay, isVisible: false });
                console.log(`🎲 Hiding result overlay for dice ${diceId}`);
                return newOverlays;
            }
            return prev;
        });
    }, []);

    /**
     * Remove a result overlay completely (only if it exists)
     */
    const removeResultOverlay = useCallback((diceId: string) => {
        setOverlays(prev => {
            if (prev.has(diceId)) {
                const newOverlays = new Map(prev);
                newOverlays.delete(diceId);
                console.log(`🎲 Removed result overlay for dice ${diceId}`);
                return newOverlays;
            }
            return prev;
        });
    }, []);

    /**
     * Clear all result overlays
     */
    const clearAllOverlays = useCallback(() => {
        setOverlays(new Map());
        console.log('🎲 Cleared all result overlays');
    }, []);

    /**
     * Clean up old overlays (older than specified age)
     */
    const cleanupOldOverlays = useCallback((maxAge: number = 10000) => {
        const now = Date.now();
        setOverlays(prev => {
            const newOverlays = new Map();
            for (const [diceId, overlay] of prev.entries()) {
                if (now - overlay.timestamp < maxAge) {
                    newOverlays.set(diceId, overlay);
                }
            }
            return newOverlays;
        });
    }, []);

    /**
     * Get all current overlays as an array
     */
    const getOverlaysArray = useCallback(() => {
        return Array.from(overlays.values());
    }, [overlays]);

    /**
     * Get a specific overlay by dice ID
     */
    const getOverlay = useCallback((diceId: string) => {
        return overlays.get(diceId);
    }, [overlays]);

    /**
     * Check if an overlay exists and is visible for a dice
     */
    const hasVisibleOverlay = useCallback((diceId: string) => {
        const overlay = overlays.get(diceId);
        return overlay && overlay.isVisible;
    }, [overlays]);

    return {
        overlays: getOverlaysArray(),
        showResultOverlay,
        showGroupSumOverlay,
        updateOverlayPosition,
        checkDistanceAndHide,
        hideResultOverlay,
        removeResultOverlay,
        clearAllOverlays,
        cleanupOldOverlays,
        getOverlay,
        hasVisibleOverlay
    };
}; 