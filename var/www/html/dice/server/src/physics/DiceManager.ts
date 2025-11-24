import * as CANNON from 'cannon-es';
import type { PhysicsWorld, PhysicsMaterials, ContactMaterialConfig, PhysicsConfig, DiceValuePair, DiceRollResult } from './types/DiceTypes';
import type { DiceObject } from './DiceObject';

/**
 * Manages the physics world and coordinates dice interactions
 * Singleton class that handles world setup, materials, and physics simulation
 */
export class DiceManagerClass {
    /** The Cannon.js physics world instance */
    public world: PhysicsWorld | null = null;

    /** Materials for different object types in the physics world */
    public materials: PhysicsMaterials | null = null;

    /** Whether a dice throw is currently in progress */
    public throwRunning: boolean = false;

    /** Default physics configuration */
    private readonly defaultConfig: PhysicsConfig = {
        gravity: new CANNON.Vec3(0, -9.82, 0),
        solverIterations: 10,
        allowSleep: true,
        broadphase: 'naive',
        timeStep: 1 / 60
    };

    /** Stability threshold for considering dice stationary */
    private readonly stabilityThreshold = 0.01;

    /** Number of consecutive stable frames required before dice is considered settled */
    private readonly requiredStableFrames = 10;

    /**
     * Initializes the physics world with the specified configuration
     * @param config - Optional physics configuration, uses defaults if not provided
     * @throws Error if world is already initialized
     */
    public setWorld(config: Partial<PhysicsConfig> = {}): void {
        if (this.world !== null) {
            console.warn('DiceManager world is already initialized. Use resetWorld() to reinitialize.');
            return;
        }

        // Merge provided config with defaults
        const finalConfig: PhysicsConfig = { ...this.defaultConfig, ...config };

        try {
            this.world = new CANNON.World();
            this.world.gravity.copy(finalConfig.gravity);
            this.setBroadphase(finalConfig.broadphase);
            this.configureSolver(finalConfig.solverIterations);
            this.world.allowSleep = finalConfig.allowSleep;
            this.world.defaultContactMaterial.friction = 0.01;
            this.world.defaultContactMaterial.restitution = 0.3;
            this.initializeMaterials();

            console.log('DiceManager: Physics world initialized successfully');
        } catch (error) {
            this.world = null;
            throw new Error(`Failed to initialize physics world: ${error}`);
        }
    }

    /**
     * Resets the physics world and clears all bodies
     * @param config - Optional new physics configuration
     */
    public resetWorld(config: Partial<PhysicsConfig> = {}): void {
        if (this.world) {
            const bodies = [...this.world.bodies];
            bodies.forEach(body => this.world!.removeBody(body));

            this.world.contactmaterials.length = 0;
        }

        this.world = null;
        this.materials = null;
        this.throwRunning = false;

        this.setWorld(config);
    }

    /**
     * Sets up the broadphase algorithm for collision detection
     * @param type - Type of broadphase algorithm to use
     */
    private setBroadphase(type: PhysicsConfig['broadphase']): void {
        if (!this.world) return;

        switch (type) {
            case 'naive':
                this.world.broadphase = new CANNON.NaiveBroadphase();
                break;
            case 'sap':
                this.world.broadphase = new CANNON.SAPBroadphase(this.world);
                break;
            case 'grid':
                this.world.broadphase = new CANNON.GridBroadphase();
                break;
            default:
                console.warn(`Unknown broadphase type: ${type}, using naive`);
                this.world.broadphase = new CANNON.NaiveBroadphase();
        }
    }

    /**
     * Configures the physics solver with the specified iterations
     * @param iterations - Number of solver iterations for accuracy
     */
    private configureSolver(iterations: number): void {
        if (!this.world) return;

        (this.world.solver as CANNON.GSSolver).iterations = iterations;
    }

    /**
     * Initializes the material system for different object types
     */
    private initializeMaterials(): void {
        if (!this.world) {
            throw new Error('Cannot initialize materials: physics world not set');
        }

        this.materials = {
            dice: new CANNON.Material('dice'),
            floor: new CANNON.Material('floor'),
            barrier: new CANNON.Material('barrier')
        };

        this.setupContactMaterials();
    }

    /**
     * Sets up contact materials for realistic dice interactions
     */
    private setupContactMaterials(): void {
        if (!this.world || !this.materials) return;

        // Dice-to-floor contact (low friction, medium bounce)
        const diceFloorContact: ContactMaterialConfig = {
            friction: 0.01,
            restitution: 0.5
        };
        this.world.addContactMaterial(
            new CANNON.ContactMaterial(
                this.materials.floor,
                this.materials.dice,
                diceFloorContact
            )
        );

        // Dice-to-barrier contact (no friction, high bounce for realistic walls)
        const diceBarrierContact: ContactMaterialConfig = {
            friction: 0.0,
            restitution: 1.0
        };
        this.world.addContactMaterial(
            new CANNON.ContactMaterial(
                this.materials.barrier,
                this.materials.dice,
                diceBarrierContact
            )
        );

        // Dice-to-dice contact (no friction, medium bounce)
        const diceDiceContact: ContactMaterialConfig = {
            friction: 0.0,
            restitution: 0.5
        };
        this.world.addContactMaterial(
            new CANNON.ContactMaterial(
                this.materials.dice,
                this.materials.dice,
                diceDiceContact
            )
        );
    }

    /**
     * Steps the physics simulation forward by the specified time
     * @param deltaTime - Time step in seconds (optional, uses default if not provided)
     */
    public step(deltaTime?: number): void {
        if (!this.world) {
            throw new Error('Cannot step physics: world not initialized');
        }

        const timeStep = deltaTime ?? this.defaultConfig.timeStep;
        this.world.fixedStep(timeStep);
    }

    /**
     * Gets the current physics world instance
     * @returns Physics world or null if not initialized
     */
    public getWorld(): PhysicsWorld | null {
        return this.world;
    }

    /**
     * Gets the materials configuration
     * @returns Materials object or null if not initialized
     */
    public getMaterials(): PhysicsMaterials | null {
        return this.materials;
    }

    /**
     * Checks if the physics world is properly initialized
     * @returns True if world and materials are initialized
     */
    public isInitialized(): boolean {
        return this.world !== null && this.materials !== null;
    }

    /**
     * Updates the gravity vector
     * @param gravity - New gravity vector
     * @throws Error if world is not initialized
     */
    public setGravity(gravity: CANNON.Vec3): void {
        if (!this.world) {
            throw new Error('Cannot set gravity: world not initialized');
        }
        this.world.gravity.copy(gravity);
    }

    /**
     * Gets the current gravity vector
     * @returns Current gravity vector or null if world not initialized
     */
    public getGravity(): CANNON.Vec3 | null {
        return this.world?.gravity ?? null;
    }

    /**
     * Adds a body to the physics world
     * @param body - Cannon.js body to add
     * @throws Error if world is not initialized
     */
    public addBody(body: CANNON.Body): void {
        if (!this.world) {
            throw new Error('Cannot add body: world not initialized');
        }
        this.world.addBody(body);
    }

    /**
     * Removes a body from the physics world
     * @param body - Cannon.js body to remove
     * @throws Error if world is not initialized
     */
    public removeBody(body: CANNON.Body): void {
        if (!this.world) {
            throw new Error('Cannot remove body: world not initialized');
        }
        this.world.removeBody(body);
    }

    /**
     * Gets the number of bodies currently in the physics world
     * @returns Number of bodies or 0 if world not initialized
     */
    public getBodyCount(): number {
        return this.world?.bodies.length ?? 0;
    }

    /**
     * Disposes of the physics world and cleans up resources
     */
    public dispose(): void {
        if (this.world) {
            // Remove all bodies
            const bodies = [...this.world.bodies];
            bodies.forEach(body => this.world!.removeBody(body));

            // Clear contact materials
            this.world.contactmaterials.length = 0;
        }

        this.world = null;
        this.materials = null;
        this.throwRunning = false;

        console.log('DiceManager: Physics world disposed');
    }

    /**
     * Rolls multiple dice with target values using physics simulation
     * @param diceValues - Array of dice and their target values
     * @param timeoutMs - Maximum time to wait for dice to settle (default: 10 seconds)
     * @returns Promise that resolves with roll results when all dice have settled
     * @throws Error if world is not initialized or if simulation times out
     */
    public async prepareValues(diceValues: DiceValuePair[], timeoutMs: number = 10000): Promise<DiceRollResult[]> {
        if (!this.world) {
            throw new Error('Cannot roll dice: physics world not initialized');
        }

        if (this.throwRunning) {
            throw new Error('Cannot start another throw. Please wait until the current throw is finished.');
        }

        // Validate dice values
        for (const diceValue of diceValues) {
            if (!diceValue.dice || typeof diceValue.value !== 'number') {
                throw new Error('Invalid dice value pair: must have dice object and numeric value');
            }
        }

        this.throwRunning = true;
        const startTime = Date.now();

        try {
            // Initialize dice for rolling
            for (const diceValue of diceValues) {
                diceValue.dice.simulationRunning = true;
                diceValue.vectors = diceValue.dice.getCurrentVectors();
                diceValue.stableCount = 0;
            }

            // Return a promise that resolves when all dice have settled
            return new Promise<DiceRollResult[]>((resolve, reject) => {
                const checkStability = () => {
                    // Check for timeout
                    if (Date.now() - startTime > timeoutMs) {
                        this.throwRunning = false;
                        this.world?.removeEventListener('postStep', checkStability);
                        reject(new Error(`Dice throw timed out after ${timeoutMs}ms`));
                        return;
                    }

                    let allStable = true;

                    for (const diceValue of diceValues) {
                        const isFinished = diceValue.dice.isFinished();
                        if (isFinished) {
                            diceValue.stableCount = (diceValue.stableCount || 0) + 1;
                        } else {
                            diceValue.stableCount = 0;
                        }

                        if ((diceValue.stableCount || 0) < this.requiredStableFrames) {
                            allStable = false;
                        }

                        // Debug log every 60 frames (1 second)
                        if ((Date.now() - startTime) % 1000 < 16) {
                            console.log('🎲 Stability check:', {
                                isFinished,
                                stableCount: diceValue.stableCount,
                                requiredFrames: this.requiredStableFrames,
                                elapsed: ((Date.now() - startTime) / 1000).toFixed(1) + 's'
                            });
                        }
                    }

                    if (allStable) {
                        // All dice have settled
                        this.world?.removeEventListener('postStep', checkStability);

                        try {
                            // Process final results
                            const results: DiceRollResult[] = [];
                            const settleDuration = (Date.now() - startTime) / 1000;

                            for (const diceValue of diceValues) {
                                // Get the actual value the dice landed on (natural physics result)
                                const actualValue = diceValue.dice.getUpperValue();

                                diceValue.dice.simulationRunning = false;

                                // Create result object with the natural physics result
                                const result: DiceRollResult = {
                                    dice: diceValue.dice,
                                    value: actualValue, // Use actual landed value instead of forced value
                                    settleDuration,
                                    finalPosition: diceValue.dice.getPosition(),
                                    finalRotation: diceValue.dice.getRotation()
                                };
                                results.push(result);

                                console.log('🎲 Natural dice result:', {
                                    requestedValue: diceValue.value,
                                    actualValue: actualValue,
                                    position: result.finalPosition
                                });
                            }

                            this.throwRunning = false;
                            resolve(results);
                        } catch (error) {
                            this.throwRunning = false;
                            reject(new Error(`Error processing dice results: ${error}`));
                        }
                    }
                    // Note: Removed the recursive fixedStep call - physics stepping is handled by useFrame
                };

                // Start the stability checking loop
                this.world?.addEventListener('postStep', checkStability);
            });
        } catch (error) {
            this.throwRunning = false;
            throw new Error(`Failed to start dice throw: ${error}`);
        }
    }

    /**
     * Rolls a single dice with a target value
     * @param dice - The dice object to roll
     * @param targetValue - The value the dice should land on
     * @param timeoutMs - Maximum time to wait for dice to settle
     * @returns Promise that resolves with the roll result
     */
    public async rollSingle(dice: DiceObject, targetValue: number, timeoutMs: number = 10000): Promise<DiceRollResult> {
        const results = await this.prepareValues([{ dice, value: targetValue }], timeoutMs);
        return results[0];
    }

    /**
     * Rolls multiple dice with random values (for natural rolling)
     * @param dice - Array of dice objects to roll
     * @param timeoutMs - Maximum time to wait for dice to settle
     * @returns Promise that resolves with roll results
     */
    public async rollRandom(dice: DiceObject[], timeoutMs: number = 10000): Promise<DiceRollResult[]> {
        const diceValues: DiceValuePair[] = dice.map(d => ({
            dice: d,
            value: Math.floor(Math.random() * d.getValueCount()) + 1
        }));

        return this.prepareValues(diceValues, timeoutMs);
    }

    /**
     * Checks if a dice is finished moving (stable)
     * @param dice - The dice object to check
     * @returns True if the dice is stable
     */
    public isDiceStable(dice: DiceObject): boolean {
        if (!dice || !dice.body) {
            console.log('🎲 isDiceStable: No dice or body found');
            return false;
        }

        // Access the physics body directly instead of going through userData
        const body = dice.body as CANNON.Body;
        const angularVelocity = body.angularVelocity;
        const velocity = body.velocity;

        const isStable = (
            Math.abs(angularVelocity.x) < this.stabilityThreshold &&
            Math.abs(angularVelocity.y) < this.stabilityThreshold &&
            Math.abs(angularVelocity.z) < this.stabilityThreshold &&
            Math.abs(velocity.x) < this.stabilityThreshold &&
            Math.abs(velocity.y) < this.stabilityThreshold &&
            Math.abs(velocity.z) < this.stabilityThreshold
        );

        // Debug logging - show actual values to help tune threshold
        const maxVel = Math.max(Math.abs(velocity.x), Math.abs(velocity.y), Math.abs(velocity.z));
        const maxAngVel = Math.max(Math.abs(angularVelocity.x), Math.abs(angularVelocity.y), Math.abs(angularVelocity.z));

        if (!isStable) {
            // Only log every 30th frame to avoid spam
            if (Math.random() < 0.03) {
                console.log('🎲 Dice not stable yet - maxVel:', maxVel.toFixed(4), 'maxAngVel:', maxAngVel.toFixed(4), 'threshold:', this.stabilityThreshold);
            }
        } else {
            console.log('🎲 Dice is stable!');
        }

        return isStable;
    }

    /**
     * Stops any current dice throw simulation
     * @param force - Whether to force stop even if dice are still moving
     */
    public stopThrow(force: boolean = false): void {
        if (!this.throwRunning) {
            return;
        }

        if (force) {
            // Remove any pending event listeners
            if (this.world) {
                // Note: This is a simplified approach - in production you'd want to track specific listeners
                this.world.removeEventListener('postStep', () => { });
            }

            this.throwRunning = false;
            console.log('DiceManager: Throw forcibly stopped');
        } else {
            console.warn('DiceManager: Cannot stop throw gracefully - use force=true to override');
        }
    }

    /**
     * Gets the current throw status
     * @returns Object with throw status information
     */
    public getThrowStatus() {
        return {
            isRunning: this.throwRunning,
            worldInitialized: this.isInitialized(),
            bodyCount: this.getBodyCount(),
            gravity: this.getGravity()
        };
    }
}

/**
 * Singleton instance of the DiceManager
 * Use this instance throughout your application for dice physics
 */
export const DiceManager = new DiceManagerClass(); 