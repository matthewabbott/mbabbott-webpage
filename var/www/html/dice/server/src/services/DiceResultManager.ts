export interface DiceState {
    canvasId: string;
    activityId: string;
    rollId: string;
    userId: string;
    sessionId: string;
    diceType: string;
    isVirtual: boolean;
    result: number;
    status: 'spawning' | 'rolling' | 'settled' | 'highlighted' | 'removed';
    position?: { x: number; y: number; z: number };
    timestamp: string;
}

export interface HighlightState {
    canvasId?: string;
    activityId?: string;
    isActive: boolean;
    timestamp: string;
}

export interface Position {
    x: number;
    y: number;
    z: number;
}

export class DiceResultManager {
    private diceStates = new Map<string, DiceState>();
    private activityToDice = new Map<string, string[]>(); // activityId -> canvasIds[]
    private canvasToActivity = new Map<string, string>(); // canvasId -> activityId
    private highlightState: HighlightState | null = null;
    private eventListeners: Map<string, Array<(diceId: string, result: number, position: Position) => void>> = new Map();

    /**
     * Register a new dice roll with canvas correlation
     */
    public registerDiceRoll(
        canvasId: string,
        activityId: string,
        rollId: string,
        userId: string,
        sessionId: string,
        diceType: string,
        isVirtual: boolean,
        result: number,
        position?: { x: number; y: number; z: number }
    ): void {
        const diceState: DiceState = {
            canvasId,
            activityId,
            rollId,
            userId,
            sessionId,
            diceType,
            isVirtual,
            result,
            status: 'spawning',
            position,
            timestamp: new Date().toISOString()
        };

        this.diceStates.set(canvasId, diceState);
        this.canvasToActivity.set(canvasId, activityId);

        // Add to activity mapping
        if (!this.activityToDice.has(activityId)) {
            this.activityToDice.set(activityId, []);
        }
        this.activityToDice.get(activityId)!.push(canvasId);

        this.emit('diceRegistered', diceState);
        console.log(`🎲 Registered dice: ${canvasId} for activity: ${activityId}`);
    }

    /**
     * Update dice status
     */
    public updateDiceStatus(canvasId: string, status: DiceState['status']): void {
        const diceState = this.diceStates.get(canvasId);
        if (diceState) {
            diceState.status = status;
            diceState.timestamp = new Date().toISOString();
            this.emit('diceStatusChanged', diceState);
            console.log(`🎲 Updated dice ${canvasId} status to: ${status}`);
        }
    }

    /**
     * Update dice position
     */
    public updateDicePosition(canvasId: string, position: { x: number; y: number; z: number }): void {
        const diceState = this.diceStates.get(canvasId);
        if (diceState) {
            diceState.position = position;
            diceState.timestamp = new Date().toISOString();
            this.emit('dicePositionChanged', diceState);
        }
    }

    /**
     * Get dice state by canvas ID
     */
    public getDiceState(canvasId: string): DiceState | undefined {
        return this.diceStates.get(canvasId);
    }

    /**
     * Get all dice for an activity
     */
    public getDiceForActivity(activityId: string): DiceState[] {
        const canvasIds = this.activityToDice.get(activityId) || [];
        return canvasIds.map(id => this.diceStates.get(id)).filter(Boolean) as DiceState[];
    }

    /**
     * Get activity ID for a canvas dice
     */
    public getActivityForDice(canvasId: string): string | undefined {
        return this.canvasToActivity.get(canvasId);
    }

    /**
     * Highlight dice by canvas ID
     */
    public highlightDice(canvasId: string): void {
        const activityId = this.getActivityForDice(canvasId);
        this.setHighlight({ canvasId, activityId, isActive: true, timestamp: new Date().toISOString() });

        // Update dice status
        this.updateDiceStatus(canvasId, 'highlighted');
    }

    /**
     * Highlight dice by activity ID
     */
    public highlightActivity(activityId: string): void {
        const diceStates = this.getDiceForActivity(activityId);
        if (diceStates.length > 0) {
            // Highlight the first dice (or all if multiple)
            const primaryDice = diceStates[0];
            this.setHighlight({
                canvasId: primaryDice.canvasId,
                activityId,
                isActive: true,
                timestamp: new Date().toISOString()
            });

            // Update all dice status
            diceStates.forEach(dice => {
                this.updateDiceStatus(dice.canvasId, 'highlighted');
            });
        }
    }

    /**
     * Clear all highlights
     */
    public clearHighlight(): void {
        if (this.highlightState) {
            // Reset dice status
            if (this.highlightState.canvasId) {
                const diceState = this.getDiceState(this.highlightState.canvasId);
                if (diceState && diceState.status === 'highlighted') {
                    this.updateDiceStatus(this.highlightState.canvasId, 'settled');
                }
            }

            if (this.highlightState.activityId) {
                const diceStates = this.getDiceForActivity(this.highlightState.activityId);
                diceStates.forEach(dice => {
                    if (dice.status === 'highlighted') {
                        this.updateDiceStatus(dice.canvasId, 'settled');
                    }
                });
            }
        }

        this.setHighlight(null);
    }

    /**
     * Get current highlight state
     */
    public getHighlightState(): HighlightState | null {
        return this.highlightState;
    }

    /**
     * Remove dice from tracking
     */
    public removeDice(canvasId: string): void {
        const diceState = this.diceStates.get(canvasId);
        if (diceState) {
            // Remove from activity mapping
            const activityId = diceState.activityId;
            const canvasIds = this.activityToDice.get(activityId);
            if (canvasIds) {
                const index = canvasIds.indexOf(canvasId);
                if (index > -1) {
                    canvasIds.splice(index, 1);
                    if (canvasIds.length === 0) {
                        this.activityToDice.delete(activityId);
                    }
                }
            }

            // Clear highlight if this dice was highlighted
            if (this.highlightState?.canvasId === canvasId) {
                this.clearHighlight();
            }

            // Remove from maps
            this.diceStates.delete(canvasId);
            this.canvasToActivity.delete(canvasId);

            this.emit('diceRemoved', diceState);
            console.log(`🎲 Removed dice: ${canvasId}`);
        }
    }

    /**
     * Get all active dice
     */
    public getAllActiveDice(): DiceState[] {
        return Array.from(this.diceStates.values()).filter(dice => dice.status !== 'removed');
    }

    /**
     * Get dice by user
     */
    public getDiceByUser(userId: string): DiceState[] {
        return Array.from(this.diceStates.values()).filter(dice => dice.userId === userId);
    }

    /**
     * Get dice by session
     */
    public getDiceBySession(sessionId: string): DiceState[] {
        return Array.from(this.diceStates.values()).filter(dice => dice.sessionId === sessionId);
    }

    /**
     * Clear all dice for a user (e.g., when they disconnect)
     */
    public clearUserDice(userId: string): void {
        const userDice = this.getDiceByUser(userId);
        userDice.forEach(dice => {
            this.removeDice(dice.canvasId);
        });
        console.log(`🎲 Cleared ${userDice.length} dice for user: ${userId}`);
    }

    /**
     * Clear all dice for a session
     */
    public clearSessionDice(sessionId: string): void {
        const sessionDice = this.getDiceBySession(sessionId);
        sessionDice.forEach(dice => {
            this.removeDice(dice.canvasId);
        });
        console.log(`🎲 Cleared ${sessionDice.length} dice for session: ${sessionId}`);
    }

    /**
     * Get statistics
     */
    public getStats(): {
        totalDice: number;
        activeDice: number;
        virtualDice: number;
        physicalDice: number;
        highlightedDice: number;
    } {
        const allDice = Array.from(this.diceStates.values());
        const activeDice = allDice.filter(dice => dice.status !== 'removed');

        return {
            totalDice: allDice.length,
            activeDice: activeDice.length,
            virtualDice: activeDice.filter(dice => dice.isVirtual).length,
            physicalDice: activeDice.filter(dice => !dice.isVirtual).length,
            highlightedDice: activeDice.filter(dice => dice.status === 'highlighted').length
        };
    }

    // Event system for notifications
    private setHighlight(highlight: HighlightState | null): void {
        this.highlightState = highlight;
        this.emit('highlightChanged', highlight);
    }

    public on(event: 'diceSettled', callback: (diceId: string, result: number, position: Position) => void): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(callback);
    }

    public off(event: 'diceSettled', callback: (diceId: string, result: number, position: Position) => void): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    private emit(event: string, ...args: unknown[]): void {
        if (event === 'diceSettled' && args.length >= 3) {
            const listeners = this.eventListeners.get(event) || [];
            const [diceId, result, position] = args as [string, number, Position];
            listeners.forEach(callback => {
                try {
                    callback(diceId, result, position);
                } catch (error) {
                    console.error(`Error in DiceResultManager event listener for ${event}:`, error);
                }
            });
        }
        // For other events, we can add more specific handling as needed
    }

    /**
     * Clear all data (for testing or reset)
     */
    public clear(): void {
        this.diceStates.clear();
        this.activityToDice.clear();
        this.canvasToActivity.clear();
        this.highlightState = null;
        this.emit('cleared', null);
        console.log('🎲 DiceResultManager cleared');
    }
} 