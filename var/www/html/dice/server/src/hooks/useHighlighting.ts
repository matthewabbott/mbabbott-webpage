import { useState, useCallback } from 'react';

export interface HighlightState {
    highlightedActivityId: string | null;
    highlightedDiceIds: Set<string>;
}

export interface ActivityData {
    id: string;
    roll?: {
        canvasData?: {
            dice: Array<{
                canvasId: string;
                diceType: string;
                isVirtual: boolean;
                result?: number;
            }>;
        };
    };
}

// Global state for highlighting - shared across all hook instances
let globalHighlightState: HighlightState = {
    highlightedActivityId: null,
    highlightedDiceIds: new Set()
};

let globalActivities: ActivityData[] = [];
let stateUpdateCallbacks: Set<(state: HighlightState) => void> = new Set();

// Global camera jump callback
let globalCameraJumpCallback: ((position: { x: number; y: number; z: number }, target?: { x: number; y: number; z: number }) => void) | null = null;

// Global dice position getter callback
let globalGetDicePositionCallback: ((diceId: string) => { x: number; y: number; z: number } | null) | null = null;

/**
 * Client-side highlighting hook that manages global highlight state
 * and provides correlation between activities and dice
 */
export const useHighlighting = () => {
    const [highlightState, setHighlightState] = useState<HighlightState>(globalHighlightState);

    // Register this component for state updates
    const updateLocalState = useCallback((newState: HighlightState) => {
        setHighlightState(newState);
    }, []);

    // Add this callback to the global set
    stateUpdateCallbacks.add(updateLocalState);

    // Helper to update global state and notify all components
    const updateGlobalState = useCallback((newState: HighlightState) => {
        globalHighlightState = newState;
        stateUpdateCallbacks.forEach(callback => callback(newState));
    }, []);

    /**
     * Update the global activities list
     */
    const setActivities = useCallback((activities: ActivityData[]) => {
        globalActivities = activities;
    }, []);

    /**
     * Set the camera jump callback
     */
    const setCameraJumpCallback = useCallback((callback: (position: { x: number; y: number; z: number }, target?: { x: number; y: number; z: number }) => void) => {
        globalCameraJumpCallback = callback;
    }, []);

    /**
     * Set the dice position getter callback
     */
    const setGetDicePositionCallback = useCallback((callback: (diceId: string) => { x: number; y: number; z: number } | null) => {
        globalGetDicePositionCallback = callback;
    }, []);

    /**
     * Highlight an activity and all its associated dice (or clear if already highlighted)
     */
    const highlightFromActivity = useCallback((activityId: string, activities?: ActivityData[]) => {
        if (globalHighlightState.highlightedActivityId === activityId) {
            updateGlobalState({
                highlightedActivityId: null,
                highlightedDiceIds: new Set()
            });
            console.log(`🎯 Cleared highlight for activity ${activityId}`);
            return;
        }

        const activitiesToSearch = activities || globalActivities;
        const activity = activitiesToSearch.find(a => a.id === activityId);

        if (!activity?.roll?.canvasData?.dice) {
            console.warn(`No dice found for activity ${activityId}`);
            updateGlobalState({
                highlightedActivityId: activityId,
                highlightedDiceIds: new Set()
            });
            return;
        }

        const diceIds = activity.roll.canvasData.dice.map(die => die.canvasId);

        updateGlobalState({
            highlightedActivityId: activityId,
            highlightedDiceIds: new Set(diceIds)
        });

        console.log(`🎯 Highlighted activity ${activityId} with ${diceIds.length} dice:`, diceIds);

        if (diceIds.length > 0 && globalCameraJumpCallback && globalGetDicePositionCallback) {
            const firstDiceId = diceIds[0];
            const dicePosition = globalGetDicePositionCallback(firstDiceId);
            if (dicePosition) {
                globalCameraJumpCallback(dicePosition);
                console.log(`📷 Camera jumped to dice ${firstDiceId} at position:`, dicePosition);
            }
        }
    }, [updateGlobalState]);

    /**
     * Highlight a dice and its associated activity + all dice from that roll (or clear if already highlighted)
     */
    const highlightFromDice = useCallback((diceId: string, activities?: ActivityData[]) => {
        if (globalHighlightState.highlightedDiceIds.has(diceId)) {
            updateGlobalState({
                highlightedActivityId: null,
                highlightedDiceIds: new Set()
            });
            console.log(`🎯 Cleared highlight for dice ${diceId}`);
            return;
        }

        const activitiesToSearch = activities || globalActivities;

        console.log(`🔍 Looking for dice ${diceId} in ${activitiesToSearch.length} activities`);

        const availableDiceIds = activitiesToSearch.flatMap(a =>
            a.roll?.canvasData?.dice?.map(die => die.canvasId) || []
        );
        console.log(`🔍 Available dice IDs:`, availableDiceIds);

        const activity = activitiesToSearch.find(a =>
            a.roll?.canvasData?.dice?.some(die => die.canvasId === diceId)
        );

        if (!activity) {
            console.warn(`No activity found for dice ${diceId}`);
            updateGlobalState({
                highlightedActivityId: null,
                highlightedDiceIds: new Set([diceId])
            });
            return;
        }

        const allDiceIds = activity.roll?.canvasData?.dice?.map(die => die.canvasId) || [];

        updateGlobalState({
            highlightedActivityId: activity.id,
            highlightedDiceIds: new Set(allDiceIds)
        });

        console.log(`🎯 Highlighted dice ${diceId} -> activity ${activity.id} with ${allDiceIds.length} dice:`, allDiceIds);
    }, [updateGlobalState]);

    /**
     * Clear all highlights
     */
    const clearHighlight = useCallback(() => {
        updateGlobalState({
            highlightedActivityId: null,
            highlightedDiceIds: new Set()
        });
        console.log('🎯 Cleared all highlights');
    }, [updateGlobalState]);

    /**
     * Check if an activity is highlighted
     */
    const isActivityHighlighted = useCallback((activityId: string) => {
        return globalHighlightState.highlightedActivityId === activityId;
    }, []);

    /**
     * Check if a dice is highlighted
     */
    const isDiceHighlighted = useCallback((diceId: string) => {
        return globalHighlightState.highlightedDiceIds.has(diceId);
    }, []);

    /**
     * Get the current activities
     */
    const getActivities = useCallback(() => {
        return globalActivities;
    }, []);

    return {
        highlightState,
        setActivities,
        setCameraJumpCallback,
        setGetDicePositionCallback,
        highlightFromActivity,
        highlightFromDice,
        clearHighlight,
        isActivityHighlighted,
        isDiceHighlighted,
        getActivities
    };
}; 