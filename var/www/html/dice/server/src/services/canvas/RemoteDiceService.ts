import { DiceManager, DiceD4, DiceD6, DiceD8, DiceD10, DiceD12, DiceD20 } from '../../physics';
import type { RemoteDiceData } from '../CanvasSyncManager';
import * as CANNON from 'cannon-es';

// Define available dice types
type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
type DiceInstance = DiceD4 | DiceD6 | DiceD8 | DiceD10 | DiceD12 | DiceD20;

export interface RemoteDice {
    id: string;
    playerId: string;
    playerName: string;
    diceType: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
    value?: number;
    timestamp: number;
    diceInstance?: DiceInstance; // The actual physics dice instance
}

export interface RemotePlayer {
    id: string;
    name: string;
    dice: RemoteDice[];
    lastActivity: number;
}

export interface RemoteDiceOperations {
    spawnRemoteDice: (diceData: RemoteDiceData) => Promise<void>;
    applyRemoteDiceThrow: (diceId: string, velocity: { x: number; y: number; z: number }) => void;
    applyRemoteDiceSettle: (diceId: string, position: { x: number; y: number; z: number }, result: number) => void;
    applyRemoteDiceHighlight: (diceId: string, color: string) => void;
    removeRemoteDice: (diceId: string) => void;
    clearRemoteDice: () => void;
}

/**
 * Service for handling remote dice state management
 * Extracted from sync hooks for better testability and separation of concerns
 */
export class RemoteDiceService {
    private remoteDiceInstances: Map<string, DiceInstance> = new Map();
    private remotePlayers: Map<string, RemotePlayer> = new Map();
    private updateCallbacks: ((players: RemotePlayer[]) => void)[] = [];
    private isInitialized: boolean = false;
    private onDiceSettleCallback?: (diceId: string, result: number, position: [number, number, number]) => void;

    /**
     * Initialize the service
     */
    public initialize(): void {
        this.isInitialized = true;
    }

    /**
     * Set callback for when dice settle (for floating result overlays)
     */
    public setOnDiceSettleCallback(callback: (diceId: string, result: number, position: [number, number, number]) => void): void {
        this.onDiceSettleCallback = callback;
    }

    /**
     * Spawn a remote dice from sync data
     */
    public async spawnRemoteDice(diceData: RemoteDiceData): Promise<void> {
        if (!this.isInitialized) return;

        // Skip physical dice creation for virtual dice
        if (diceData.isVirtual) {
            console.log(`📡 Skipping physical spawn for virtual ${diceData.diceType} from user ${diceData.userId}`);
            // Update player data for tracking but don't create physical dice
            this.updatePlayerDice(diceData);
            return;
        }

        try {
            let newDice: DiceInstance;
            const options = { size: 1 };

            // Create dice based on type
            switch (diceData.diceType as DiceType) {
                case 'd4':
                    newDice = new DiceD4(options);
                    break;
                case 'd6':
                    newDice = new DiceD6(options);
                    break;
                case 'd8':
                    newDice = new DiceD8(options);
                    break;
                case 'd10':
                    newDice = new DiceD10(options);
                    break;
                case 'd12':
                    newDice = new DiceD12(options);
                    break;
                case 'd20':
                    newDice = new DiceD20(options);
                    break;
                default:
                    newDice = new DiceD6(options);
            }

            // Set position from remote data
            newDice.body.position.set(
                diceData.position.x,
                diceData.position.y,
                diceData.position.z
            );

            // Add random rotation for visual variety
            newDice.body.quaternion.set(
                Math.random() * 0.5,
                Math.random() * 0.5,
                Math.random() * 0.5,
                Math.random() * 0.5
            );
            newDice.body.quaternion.normalize();

            // Add to physics world
            DiceManager.addBody(newDice.body);

            // Apply dampening for controlled behavior
            newDice.body.linearDamping = 0.1;
            newDice.body.angularDamping = 0.1;

            // Add gentle spawn forces for dynamic entry
            const spawnForce = new CANNON.Vec3(
                (Math.random() - 0.5) * 8,  // Random horizontal force -4 to 4
                Math.random() * 4,          // Random upward force 0 to 4
                (Math.random() - 0.5) * 8   // Random horizontal force -4 to 4
            );

            newDice.body.velocity.set(spawnForce.x, spawnForce.y, spawnForce.z);

            // Add gentle angular velocity for spinning
            const angularForce = new CANNON.Vec3(
                (Math.random() - 0.5) * 8,  // Random spin
                (Math.random() - 0.5) * 8,  // Random spin  
                (Math.random() - 0.5) * 8   // Random spin
            );
            newDice.body.angularVelocity.set(angularForce.x, angularForce.y, angularForce.z);

            // Wake up the body to ensure physics simulation
            newDice.body.wakeUp();

            // Store in remote dice map
            this.remoteDiceInstances.set(diceData.canvasId, newDice);

            // Update player data
            this.updatePlayerDice(diceData);

            console.log(`📡 Spawned remote ${diceData.diceType} from user ${diceData.userId} at:`, diceData.position);

        } catch (error) {
            console.error(`❌ Failed to spawn remote ${diceData.diceType}:`, error);
        }
    }

    /**
     * Apply throw velocity to remote dice
     */
    public applyRemoteDiceThrow(diceId: string, velocity: { x: number; y: number; z: number }): void {
        const remoteDie = this.remoteDiceInstances.get(diceId);
        if (remoteDie) {
            remoteDie.body.velocity.set(velocity.x, velocity.y, velocity.z);
            remoteDie.body.wakeUp();
            console.log(`📡 Applied remote throw to dice ${diceId}`);
        }
    }

    /**
     * Apply settle position and result to remote dice
     */
    public applyRemoteDiceSettle(diceId: string, position: { x: number; y: number; z: number }, result: number): void {
        const remoteDie = this.remoteDiceInstances.get(diceId);
        if (remoteDie) {
            // Smoothly move to final position
            remoteDie.body.position.set(position.x, position.y, position.z);
            remoteDie.body.velocity.set(0, 0, 0);
            remoteDie.body.angularVelocity.set(0, 0, 0);

            // Trigger floating result overlay callback
            if (this.onDiceSettleCallback) {
                const overlayPosition: [number, number, number] = [position.x, position.y, position.z];
                this.onDiceSettleCallback(diceId, result, overlayPosition);
            }

            console.log(`📡 Settled remote dice ${diceId} at result ${result}`);
        }
    }

    /**
     * Apply highlight to remote dice
     */
    public applyRemoteDiceHighlight(diceId: string, color: string): void {
        console.log(`📡 Highlighting dice ${diceId} with color ${color}`);
    }

    /**
     * Remove a specific remote dice
     */
    public removeRemoteDice(diceId: string): void {
        const remoteDie = this.remoteDiceInstances.get(diceId);
        if (remoteDie) {
            DiceManager.removeBody(remoteDie.body);
            this.remoteDiceInstances.delete(diceId);
            console.log(`📡 Removed remote dice ${diceId}`);
        }
    }

    /**
     * Clear all remote dice
     */
    public clearRemoteDice(): void {
        this.remoteDiceInstances.forEach(die => {
            DiceManager.removeBody(die.body);
        });
        this.remoteDiceInstances.clear();
        this.remotePlayers.clear();
        console.log('📡 Cleared all remote dice');
        this.notifyUpdate();
    }

    /**
     * Remove all dice for a specific player (TODO)
     */
    public clearPlayerDice(playerId: string): void {
        // Find and remove all dice for this player
        // TODO: Implement proper player-to-dice tracking
        // For now, we'll just remove the player from tracking

        // Remove player from tracking
        this.remotePlayers.delete(playerId);
        this.notifyUpdate();
        console.log(`📡 Cleared dice for player ${playerId}`);
    }

    /**
     * Get all remote dice instances
     */
    public getAllRemoteDiceInstances(): Map<string, DiceInstance> {
        return new Map(this.remoteDiceInstances);
    }

    /**
     * Get all remote dice from all players
     */
    public getAllRemoteDice(): RemoteDice[] {
        const allDice: RemoteDice[] = [];
        this.remotePlayers.forEach(player => {
            allDice.push(...player.dice);
        });
        return allDice;
    }

    /**
     * Get dice for a specific player
     */
    public getPlayerDice(playerId: string): RemoteDice[] {
        const player = this.remotePlayers.get(playerId);
        return player ? [...player.dice] : [];
    }

    /**
     * Get all remote players
     */
    public getAllPlayers(): RemotePlayer[] {
        return Array.from(this.remotePlayers.values());
    }

    /**
     * Subscribe to remote dice updates
     */
    public onUpdate(callback: (players: RemotePlayer[]) => void): void {
        this.updateCallbacks.push(callback);
    }

    /**
     * Unsubscribe from remote dice updates
     */
    public offUpdate(callback: (players: RemotePlayer[]) => void): void {
        const index = this.updateCallbacks.indexOf(callback);
        if (index > -1) {
            this.updateCallbacks.splice(index, 1);
        }
    }

    /**
     * Get remote dice operations interface
     */
    public getOperations(): RemoteDiceOperations {
        return {
            spawnRemoteDice: this.spawnRemoteDice.bind(this),
            applyRemoteDiceThrow: this.applyRemoteDiceThrow.bind(this),
            applyRemoteDiceSettle: this.applyRemoteDiceSettle.bind(this),
            applyRemoteDiceHighlight: this.applyRemoteDiceHighlight.bind(this),
            removeRemoteDice: this.removeRemoteDice.bind(this),
            clearRemoteDice: this.clearRemoteDice.bind(this)
        };
    }

    /**
     * Update player dice data
     */
    private updatePlayerDice(diceData: RemoteDiceData): void {
        const playerId = diceData.userId;

        if (!this.remotePlayers.has(playerId)) {
            this.remotePlayers.set(playerId, {
                id: playerId,
                name: playerId, // TODO: Get actual player name
                dice: [],
                lastActivity: Date.now()
            });
        }

        const player = this.remotePlayers.get(playerId)!;

        // Create remote dice entry
        const remoteDice: RemoteDice = {
            id: diceData.canvasId,
            playerId: diceData.userId,
            playerName: playerId, // TODO: Get actual player name
            diceType: diceData.diceType,
            position: diceData.position,
            rotation: { x: 0, y: 0, z: 0, w: 1 }, // TODO: Get actual rotation
            value: diceData.result,
            timestamp: Date.now(),
            diceInstance: this.remoteDiceInstances.get(diceData.canvasId)
        };

        // Add to player's dice
        player.dice.push(remoteDice);
        player.lastActivity = Date.now();

        this.notifyUpdate();
    }

    /**
     * Notify all subscribers of updates
     */
    private notifyUpdate(): void {
        const players = this.getAllPlayers();
        this.updateCallbacks.forEach(callback => {
            try {
                callback(players);
            } catch (error) {
                console.error('Error in remote dice update callback:', error);
            }
        });
    }

    /**
     * Clean up old/inactive players
     */
    public cleanupInactivePlayers(maxAge: number = 300000): void { // 5 minutes default
        const now = Date.now();
        for (const [playerId, player] of this.remotePlayers.entries()) {
            if (now - player.lastActivity > maxAge) {
                // Remove all dice for this player
                player.dice.forEach(dice => {
                    if (dice.diceInstance) {
                        this.removeRemoteDice(dice.id);
                    }
                });
                this.remotePlayers.delete(playerId);
            }
        }
        this.notifyUpdate();
    }
} 