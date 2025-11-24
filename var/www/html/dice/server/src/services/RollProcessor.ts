import { v4 as uuidv4 } from 'uuid';

export interface DiceRoll {
    canvasId: string;
    diceType: string;
    position?: Position;
    isVirtual: boolean;
    virtualRolls?: number[];
    result: number;
}

export interface Position {
    x: number;
    y: number;
    z: number;
}

export interface CanvasData {
    diceRolls: DiceRoll[];
}

export interface ProcessedRoll {
    result: number;
    rolls: number[];
    interpretedExpression: string;
    canvasData: CanvasData;
}

export interface RollConfig {
    maxPhysicalDice: number;
    maxTotalDice: number;
    supportedDiceTypes: string[];
    virtualDiceThreshold: number;
    massiveRollThreshold: number;
    nonStandardDiceThreshold: number;
    complexityThreshold: number;
    enableSmartClustering: boolean;
    maxPhysicalDicePerType: number;
}

export class RollProcessor {
    private static readonly DEFAULT_CONFIG: RollConfig = {
        maxPhysicalDice: 10,
        maxTotalDice: 10000,
        supportedDiceTypes: ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'],
        virtualDiceThreshold: 100,
        massiveRollThreshold: 50,
        nonStandardDiceThreshold: 100,
        complexityThreshold: 200,
        enableSmartClustering: true,
        maxPhysicalDicePerType: 5
    };

    private config: RollConfig;

    constructor(config: Partial<RollConfig> = {}) {
        this.config = { ...RollProcessor.DEFAULT_CONFIG, ...config };
    }

    /**
     * Parse and process a dice expression into roll results and canvas instructions
     * @param expression - Dice expression like "2d6", "1000d20", "d100"
     * @returns Processed roll with results and canvas data
     */
    public processRoll(expression: string): ProcessedRoll {
        const parseResult = this.parseExpression(expression);
        if (!parseResult.isValid) {
            return {
                result: 0,
                rolls: [],
                interpretedExpression: "invalid",
                canvasData: { diceRolls: [] }
            };
        }

        const { numDice, dieType, interpretedExpression } = parseResult;

        // Generate actual roll results
        const rolls = this.generateRolls(numDice, dieType);
        const result = rolls.reduce((sum, roll) => sum + roll, 0);

        // Determine canvas representation
        const canvasData = this.generateCanvasData(numDice, dieType, rolls);

        return {
            result,
            rolls,
            interpretedExpression,
            canvasData
        };
    }

    /**
     * Parse a dice expression into components
     * @param expression - Raw dice expression
     * @returns Parsed components or invalid result
     */
    private parseExpression(expression: string): {
        isValid: boolean;
        numDice: number;
        dieType: number;
        interpretedExpression: string;
    } {
        // Enhanced regex to handle more complex expressions
        const match = expression.toLowerCase().trim().match(/^(?:(\d+))?d(\d+)$/);

        if (!match) {
            console.error(`Invalid dice expression format: ${expression}. Expected format like "XdY" or "dY".`);
            return { isValid: false, numDice: 0, dieType: 0, interpretedExpression: "invalid" };
        }

        let numDice = match[1] ? parseInt(match[1], 10) : 1;
        let dieType = parseInt(match[2], 10);

        // Apply limits and corrections
        if (numDice > this.config.maxTotalDice) {
            console.warn(`Capping dice count from ${numDice} to ${this.config.maxTotalDice}`);
            numDice = this.config.maxTotalDice;
        }

        if (numDice <= 0) {
            console.warn(`Invalid dice count ${numDice}, defaulting to 1`);
            numDice = 1;
        }

        if (dieType < 1) {
            console.warn(`Invalid die type ${dieType}, defaulting to 1`);
            dieType = 1;
        }

        const interpretedExpression = `${numDice}d${dieType}`;

        return {
            isValid: true,
            numDice,
            dieType,
            interpretedExpression
        };
    }

    /**
     * Generate random roll results
     * @param numDice - Number of dice to roll
     * @param dieType - Type of die (number of sides)
     * @returns Array of roll results
     */
    private generateRolls(numDice: number, dieType: number): number[] {
        const rolls: number[] = [];
        for (let i = 0; i < numDice; i++) {
            rolls.push(Math.floor(Math.random() * dieType) + 1);
        }
        return rolls;
    }

    /**
     * Generate canvas data based on roll parameters (Enhanced for Phase 4.3: Smart Clustering)
     * @param numDice - Number of dice rolled
     * @param dieType - Type of die
     * @param rolls - Individual roll results
     * @returns Canvas data with dice representations
     */
    private generateCanvasData(numDice: number, dieType: number, rolls: number[]): CanvasData {
        const diceRolls: DiceRoll[] = [];

        // Determine if this should be virtual or physical representation
        const shouldBeVirtual = this.shouldUseVirtualRepresentation(numDice, dieType);

        if (shouldBeVirtual) {
            // Get virtual representation strategy
            const strategy = this.getVirtualRepresentationStrategy(numDice, dieType);

            console.log(`🎲 Using virtual strategy: ${strategy.strategy} for ${numDice}d${dieType}`);

            switch (strategy.strategy) {
                case 'single':
                    // Single representative dice with all virtual rolls
                    const singleVirtualDice: DiceRoll = {
                        canvasId: uuidv4(),
                        diceType: strategy.representativeDiceType,
                        position: this.generateSpawnPosition(0, 1),
                        isVirtual: true,
                        virtualRolls: rolls,
                        result: rolls.reduce((sum, roll) => sum + roll, 0)
                    };
                    diceRolls.push(singleVirtualDice);
                    break;

                case 'cluster':
                    // Multiple representative dice with clustered virtual rolls
                    const clusterSize = Math.ceil(numDice / strategy.physicalDiceCount);

                    for (let i = 0; i < strategy.physicalDiceCount; i++) {
                        const startIndex = i * clusterSize;
                        const endIndex = Math.min(startIndex + clusterSize, numDice);
                        const clusterRolls = rolls.slice(startIndex, endIndex);

                        if (clusterRolls.length > 0) {
                            const clusterDice: DiceRoll = {
                                canvasId: uuidv4(),
                                diceType: strategy.representativeDiceType,
                                position: this.generateSpawnPosition(i, strategy.physicalDiceCount),
                                isVirtual: true,
                                virtualRolls: clusterRolls,
                                result: clusterRolls.reduce((sum, roll) => sum + roll, 0)
                            };
                            diceRolls.push(clusterDice);
                        }
                    }
                    break;

                case 'hybrid':
                    // Hybrid approach: mix of physical and virtual dice
                    // For now, fall back to single strategy
                    const hybridDice: DiceRoll = {
                        canvasId: uuidv4(),
                        diceType: strategy.representativeDiceType,
                        position: this.generateSpawnPosition(0, 1),
                        isVirtual: true,
                        virtualRolls: rolls,
                        result: rolls.reduce((sum, roll) => sum + roll, 0)
                    };
                    diceRolls.push(hybridDice);
                    break;
            }
        } else {
            const physicalDiceType = this.getPhysicalDiceType(dieType);

            for (let i = 0; i < numDice; i++) {
                const physicalDice: DiceRoll = {
                    canvasId: uuidv4(),
                    diceType: physicalDiceType,
                    position: this.generateSpawnPosition(i, numDice),
                    isVirtual: false,
                    result: rolls[i]
                };
                diceRolls.push(physicalDice);
            }
        }

        return { diceRolls };
    }

    /**
     * Determine if a roll should use virtual representation (Enhanced for Phase 4.1)
     * @param numDice - Number of dice
     * @param dieType - Type of die
     * @returns True if should be virtual
     */
    private shouldUseVirtualRepresentation(numDice: number, dieType: number): boolean {
        // Enhanced virtual dice detection logic

        // 1. Massive roll detection
        if (numDice >= this.config.massiveRollThreshold) {
            console.log(`🎲 Virtual dice: Massive roll detected (${numDice} dice >= ${this.config.massiveRollThreshold})`);
            return true;
        }

        // 2. Non-standard dice detection
        if (dieType > this.config.nonStandardDiceThreshold) {
            console.log(`🎲 Virtual dice: Non-standard die detected (d${dieType} > d${this.config.nonStandardDiceThreshold})`);
            return true;
        }

        // 3. Unsupported dice type detection
        if (!this.config.supportedDiceTypes.includes(`d${dieType}`)) {
            console.log(`🎲 Virtual dice: Unsupported die type (d${dieType} not in supported types)`);
            return true;
        }

        // 4. Total physical dice limit
        if (numDice > this.config.maxPhysicalDice) {
            console.log(`🎲 Virtual dice: Too many dice (${numDice} > ${this.config.maxPhysicalDice})`);
            return true;
        }

        // 5. Complexity threshold (numDice * dieType as complexity score)
        const complexityScore = numDice * dieType;
        if (complexityScore > this.config.complexityThreshold) {
            console.log(`🎲 Virtual dice: Complexity threshold exceeded (${complexityScore} > ${this.config.complexityThreshold})`);
            return true;
        }

        // 6. Virtual dice threshold (legacy check)
        if (numDice * dieType > this.config.virtualDiceThreshold) {
            console.log(`🎲 Virtual dice: Virtual threshold exceeded (${numDice * dieType} > ${this.config.virtualDiceThreshold})`);
            return true;
        }

        console.log(`🎲 Physical dice: Using physical representation for ${numDice}d${dieType}`);
        return false;
    }

    /**
     * Calculate complexity score for a dice roll
     * @param numDice - Number of dice
     * @param dieType - Type of die
     * @returns Complexity score
     */
    private calculateComplexityScore(numDice: number, dieType: number): number {
        let score = numDice * dieType;

        if (!this.config.supportedDiceTypes.includes(`d${dieType}`)) {
            score += 50;
        }

        if (dieType > this.config.nonStandardDiceThreshold) {
            score += (dieType - this.config.nonStandardDiceThreshold) * 2;
        }

        return score;
    }

    /**
     * Determine the best virtual representation strategy
     * @param numDice - Number of dice
     * @param dieType - Type of die
     * @returns Virtual representation strategy
     */
    private getVirtualRepresentationStrategy(numDice: number, dieType: number): {
        strategy: 'single' | 'cluster' | 'hybrid';
        physicalDiceCount: number;
        virtualDiceCount: number;
        representativeDiceType: string;
    } {
        const isSupported = this.config.supportedDiceTypes.includes(`d${dieType}`);
        const isMassive = numDice >= this.config.massiveRollThreshold;
        const isNonStandard = dieType > this.config.nonStandardDiceThreshold;

        if (isNonStandard || !isSupported) {
            // Non-standard dice: single representative dice
            return {
                strategy: 'single',
                physicalDiceCount: 1,
                virtualDiceCount: numDice,
                representativeDiceType: this.getPhysicalDiceType(dieType)
            };
        }

        if (isMassive) {
            // Massive rolls: single representative dice
            return {
                strategy: 'single',
                physicalDiceCount: 1,
                virtualDiceCount: numDice,
                representativeDiceType: `d${dieType}`
            };
        }

        if (this.config.enableSmartClustering && numDice > this.config.maxPhysicalDicePerType) {
            // Smart clustering: multiple representative dice
            return {
                strategy: 'cluster',
                physicalDiceCount: Math.min(this.config.maxPhysicalDicePerType, numDice),
                virtualDiceCount: numDice,
                representativeDiceType: `d${dieType}`
            };
        }

        // Fallback to single representation
        return {
            strategy: 'single',
            physicalDiceCount: 1,
            virtualDiceCount: numDice,
            representativeDiceType: this.getPhysicalDiceType(dieType)
        };
    }

    /**
     * Get the closest supported physical dice type
     * @param dieType - Requested die type
     * @returns Supported physical dice type
     */
    private getPhysicalDiceType(dieType: number): string {
        const supportedTypes = [4, 6, 8, 10, 12, 20];

        // If it's already supported, use it
        if (supportedTypes.includes(dieType)) {
            return `d${dieType}`;
        }

        // Find closest supported type
        let closest = supportedTypes[0];
        let minDiff = Math.abs(dieType - closest);

        for (const type of supportedTypes) {
            const diff = Math.abs(dieType - type);
            if (diff < minDiff) {
                minDiff = diff;
                closest = type;
            }
        }

        return `d${closest}`;
    }

    /**
     * Generate spawn position for a dice
     * @param index - Index of the dice in the roll
     * @param total - Total number of dice
     * @returns 3D position for spawning
     */
    private generateSpawnPosition(index: number, total: number): Position {
        // Arrange dice in a grid pattern above the table
        const spacing = 1.5;
        const gridSize = Math.ceil(Math.sqrt(total));
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;

        // Center the grid and add some randomization
        const offsetX = (col - gridSize / 2) * spacing + (Math.random() - 0.5) * 0.5;
        const offsetZ = (row - gridSize / 2) * spacing + (Math.random() - 0.5) * 0.5;
        const offsetY = 3 + Math.random() * 2; // Spawn above table

        return {
            x: offsetX,
            y: offsetY,
            z: offsetZ
        };
    }

    /**
     * Update configuration at runtime
     * @param newConfig - Partial configuration to merge
     */
    public updateConfig(newConfig: Partial<RollConfig>): void {
        this.config = { ...this.config, ...newConfig };
        console.log('🎲 RollProcessor configuration updated:', this.config);
    }

    /**
     * Get current configuration
     * @returns Current configuration
     */
    public getConfig(): RollConfig {
        return { ...this.config };
    }

    /**
     * Get virtual dice statistics for a roll
     * @param expression - Dice expression
     * @returns Virtual dice statistics
     */
    public getVirtualDiceStats(expression: string): {
        isVirtual: boolean;
        strategy?: string;
        physicalDiceCount?: number;
        virtualDiceCount?: number;
        complexityScore?: number;
        reasons?: string[];
    } {
        const parseResult = this.parseExpression(expression);
        if (!parseResult.isValid) {
            return { isVirtual: false };
        }

        const { numDice, dieType } = parseResult;
        const isVirtual = this.shouldUseVirtualRepresentation(numDice, dieType);

        if (!isVirtual) {
            return { isVirtual: false };
        }

        const strategy = this.getVirtualRepresentationStrategy(numDice, dieType);
        const complexityScore = this.calculateComplexityScore(numDice, dieType);

        const reasons: string[] = [];
        if (numDice >= this.config.massiveRollThreshold) {
            reasons.push(`Massive roll (${numDice} dice)`);
        }
        if (dieType > this.config.nonStandardDiceThreshold) {
            reasons.push(`Non-standard die (d${dieType})`);
        }
        if (!this.config.supportedDiceTypes.includes(`d${dieType}`)) {
            reasons.push(`Unsupported die type (d${dieType})`);
        }

        return {
            isVirtual: true,
            strategy: strategy.strategy,
            physicalDiceCount: strategy.physicalDiceCount,
            virtualDiceCount: strategy.virtualDiceCount,
            complexityScore,
            reasons
        };
    }
}
