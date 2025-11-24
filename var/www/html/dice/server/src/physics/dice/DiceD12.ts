import { DiceObject } from '../DiceObject';
import { D12Geometry, D12FaceValues, D12ValueToFace, D12FaceNormals, validateD12Geometry } from './geometries/D12Geometry';
import type { DiceOptions } from '../types/DiceTypes';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsUtils } from '../utils/PhysicsUtils';

/**
 * DiceD12 - Twelve-sided die (Dodecahedron)
 * 
 * Represents a standard dodecahedron dice with 12 pentagonal faces.
 * Each face shows numbers 1-12. The dice uses standard reading - 
 * the value is determined by which face is pointing upward (away from gravity).
 * 
 * Features:
 * - 20 vertices forming 12 pentagonal faces
 * - Golden ratio-based geometry for perfect dodecahedron
 * - Physics simulation with accurate mass and inertia
 * - Face value determination using surface normals
 * - Support for forced value positioning
 */
export class DiceD12 extends DiceObject {
    public readonly diceType = 'd12' as const;

    constructor(options: DiceOptions) {
        // Validate geometry before creating the dice
        if (!validateD12Geometry()) {
            throw new Error('D12 geometry validation failed');
        }

        super(D12Geometry, options);
        console.log('🎲 D12 (Dodecahedron) created with options:', {
            size: options.size,
            vertices: this.geometry.vertices.length,
            faces: this.geometry.faces.length,
            mass: this.geometry.mass,
            scaleFactor: this.geometry.scaleFactor
        });
    }

    /**
     * Abstract method implementation - calculates the upper face value
     * Required by DiceObject base class
     * @returns The value (1-12) of the face that is currently facing up
     */
    protected calculateUpperValue(): number {
        return this.getUpsideValue();
    }

    /**
     * Determines which face value is currently facing up
     * For D12, we find the face whose normal most closely aligns with the up vector (0, 1, 0)
     * @returns The value (1-12) of the face that is currently facing up
     */
    public getUpsideValue(): number {
        if (!this.body) {
            console.warn('D12: Cannot determine upside value - no physics body');
            return 1;
        }

        // Get the dice's current rotation
        const diceQuaternion = this.body.quaternion;
        const upVector = new THREE.Vector3(0, 1, 0); // World up direction
        let maxDotProduct = -Infinity;
        let upsideFaceIndex = 0;

        // Check each face to see which normal is most aligned with world up
        for (let faceIndex = 0; faceIndex < D12FaceNormals.length; faceIndex++) {
            const faceNormal = new THREE.Vector3(...D12FaceNormals[faceIndex]);

            // Transform the face normal by the dice's current rotation
            const rotatedNormal = faceNormal.clone();
            rotatedNormal.applyQuaternion(diceQuaternion);

            // Calculate how aligned this face normal is with the up vector
            const dotProduct = rotatedNormal.dot(upVector);

            // The face with the highest dot product is facing most upward
            if (dotProduct > maxDotProduct) {
                maxDotProduct = dotProduct;
                upsideFaceIndex = faceIndex;
            }
        }

        const value = D12FaceValues[upsideFaceIndex];

        if (value < 1 || value > 12) {
            console.warn(`D12: Invalid face value ${value} for face ${upsideFaceIndex}, defaulting to 1`);
            return 1;
        }

        return value;
    }

    /**
     * Positions the dice to show a specific value on top
     * @param value The value (1-12) to show on the top face
     */
    public shiftUpperValue(value: number): void {
        if (!this.body) {
            console.warn('D12: Cannot shift value - no physics body');
            return;
        }

        if (value < 1 || value > 12) {
            console.warn(`D12: Invalid value ${value}, must be between 1 and 12`);
            return;
        }

        // Get the face index for this value
        const targetFaceIndex = D12ValueToFace[value];
        if (targetFaceIndex === undefined) {
            console.warn(`D12: No face mapping found for value ${value}`);
            return;
        }

        // Get the target face normal (this should point up when dice shows this value)
        const targetFaceNormal = new THREE.Vector3(...D12FaceNormals[targetFaceIndex]);

        // Calculate rotation needed to make this face normal point up (0, 1, 0)
        const upVector = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(targetFaceNormal, upVector);

        // Apply the rotation to the physics body
        this.body.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

        // Also apply to the visual mesh
        if (this.object) {
            this.object.quaternion.copy(quaternion);
        }

        // Reset angular velocity to prevent unwanted spinning
        this.body.angularVelocity.set(0, 0, 0);
        this.body.wakeUp();

        console.log(`🎲 D12 positioned to show value ${value} (face ${targetFaceIndex})`);
    }

    /**
     * Gets a random valid value for this dice type
     * @returns Random integer between 1 and 12
     */
    public getRandomValue(): number {
        return Math.floor(Math.random() * 12) + 1;
    }

    /**
     * Validates that a value is valid for this dice type
     * @param value The value to validate
     * @returns True if value is between 1 and 12
     */
    public isValidValue(value: number): boolean {
        return Number.isInteger(value) && value >= 1 && value <= 12;
    }

    /**
     * Gets information about this dice type
     * @returns Object with dice information
     */
    public getDiceInfo() {
        return {
            type: 'D12' as const,
            sides: 12,
            shape: 'Dodecahedron',
            description: 'Twelve-sided die with pentagonal faces',
            minValue: 1,
            maxValue: 12,
            vertices: 20,
            faces: 12,
            faceShape: 'Pentagon',
            geometry: this.geometry,
            currentValue: this.getUpsideValue()
        };
    }

    /**
     * Applies a random throw force and rotation to the dice
     * Simulates throwing the dice with realistic physics
     * @param throwForce Multiplier for throw strength (default: 1.1 for balanced throws)
     * @param throwPosition Optional specific position to throw from
     */
    public throwDice(throwForce: number = 1.1, throwPosition?: THREE.Vector3): void {
        if (!this.body) {
            console.warn('D12: Cannot throw dice - no physics body');
            return;
        }

        // Set throw position if provided, otherwise use current position
        if (throwPosition) {
            this.body.position.set(throwPosition.x, throwPosition.y, throwPosition.z);
        }

        // Generate random throw velocity
        const throwStrength = throwForce * 4.0; // Base throw strength for D12
        const randomVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * throwStrength,
            Math.random() * throwStrength * 0.6 + throwStrength * 0.2, // Upward bias
            (Math.random() - 0.5) * throwStrength
        );

        // Apply random angular velocity for realistic tumbling
        const angularStrength = throwForce * 10.0; // Angular strength
        const randomAngularVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * angularStrength,
            (Math.random() - 0.5) * angularStrength,
            (Math.random() - 0.5) * angularStrength
        );

        // Set physics body velocities
        this.body.velocity.set(randomVelocity.x, randomVelocity.y, randomVelocity.z);
        this.body.angularVelocity.set(randomAngularVelocity.x, randomAngularVelocity.y, randomAngularVelocity.z);

        // Add gentle random spawn force for dynamic entry
        const spawnForce = new CANNON.Vec3(
            PhysicsUtils.randomBetween(-5, 5),
            PhysicsUtils.randomBetween(0, 3),
            PhysicsUtils.randomBetween(-5, 5)
        );
        this.body.velocity.vadd(spawnForce, this.body.velocity);

        // Wake up the physics body to ensure it responds
        this.body.wakeUp();

        console.log('🎲 D12 thrown with force:', {
            throwForce,
            velocity: randomVelocity,
            angularVelocity: randomAngularVelocity,
            position: throwPosition || this.getPosition()
        });
    }

    /**
     * Creates a string representation of the dice state
     * @returns String describing the dice
     */
    public toString(): string {
        const currentValue = this.getUpsideValue();
        const position = this.getPosition();
        return `D12(value: ${currentValue}, position: [${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}])`;
    }
} 