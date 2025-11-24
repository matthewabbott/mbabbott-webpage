import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DiceObject } from '../DiceObject';
import type { DiceOptions } from '../types/DiceTypes';
import { PhysicsUtils } from '../utils/PhysicsUtils';
import { D4Geometry, D4FaceValues, D4ValueToFace, D4FaceNormals, validateD4Geometry } from './geometries/D4Geometry';

/**
 * Four-sided dice (D4) implementation
 * Tetrahedron dice with values 1-4, where the value is read from the BOTTOM face
 * D4 dice are unique in that they don't "land" on a face like other dice,
 * instead they settle with a point up and the value is on the bottom face
 */
export class DiceD4 extends DiceObject {

    /**
     * Creates a new D4 dice instance
     * @param options - Configuration options for the dice appearance and behavior
     * @throws Error if D4 geometry validation fails
     */
    constructor(options: DiceOptions = {}) {
        // Validate geometry before creating the dice
        if (!validateD4Geometry()) {
            throw new Error('D4 geometry validation failed');
        }

        // Call parent constructor with D4 geometry
        super(D4Geometry, options);
    }

    /**
     * Calculates which value is currently showing based on the dice orientation
     * For D4, we need to find which face is pointing DOWN (touching the ground)
     * since the value is read from the bottom face, not the top
     * @returns The value (1-4) of the face currently facing down
     */
    protected calculateUpperValue(): number {
        // Get the current rotation of the dice
        const quaternion = this.body.quaternion;

        // Transform the down vector (negative gravity direction) by the dice rotation
        // We want to find which face normal is most aligned with the DOWN direction
        const downVector = new CANNON.Vec3(0, -1, 0); // World down direction
        const localDownVector = quaternion.inverse().vmult(downVector, new CANNON.Vec3());

        // Find which face normal is most aligned with the down direction
        let maxDot = -Infinity;
        let downFaceIndex = 0;

        for (let i = 0; i < D4FaceNormals.length; i++) {
            const normal = new CANNON.Vec3(
                D4FaceNormals[i][0],
                D4FaceNormals[i][1],
                D4FaceNormals[i][2]
            );

            // Calculate dot product to see how aligned this face is with "down"
            // For D4, we want the face normal pointing most strongly downward
            const dot = localDownVector.dot(normal);

            if (dot > maxDot) {
                maxDot = dot;
                downFaceIndex = i;
            }
        }

        // Return the value corresponding to the downward-facing face
        // This is the key difference from D6 - we read the bottom face, not top
        return D4FaceValues[downFaceIndex];
    }

    /**
     * Rotates the dice to show a specific value facing down
     * For D4, we position the dice so the desired value face is touching the ground
     * @param targetValue - The value (1-4) that should be facing down (touching ground)
     * @throws Error if targetValue is not between 1 and 4
     */
    public shiftUpperValue(targetValue: number): void {
        // Validate the target value
        PhysicsUtils.validateDiceValue(targetValue, 1, 4);

        // Get the face index for the target value
        const targetFaceIndex = D4ValueToFace[targetValue];

        if (targetFaceIndex === undefined) {
            throw new Error(`Invalid D4 value: ${targetValue}. Must be between 1 and 4.`);
        }

        // Get the normal vector for the target face
        const targetNormal = new CANNON.Vec3(
            D4FaceNormals[targetFaceIndex][0],
            D4FaceNormals[targetFaceIndex][1],
            D4FaceNormals[targetFaceIndex][2]
        );

        // Calculate rotation needed to align this face normal with world down (0, -1, 0)
        // For D4, we want the face normal to point downward so the face touches the ground
        const worldDown = new CANNON.Vec3(0, -1, 0);
        const quaternion = this.calculateRotationToAlignVectors(targetNormal, worldDown);

        // Apply the rotation to the dice
        this.body.quaternion.copy(quaternion);
        this.object.quaternion.copy(PhysicsUtils.cannonQuaternionToThree(quaternion));

        // Clear any velocities to ensure the dice stays in position
        this.body.velocity.set(0, 0, 0);
        this.body.angularVelocity.set(0, 0, 0);
    }

    /**
     * Calculates the quaternion rotation needed to align one vector with another
     * @param from - The source vector (face normal)
     * @param to - The target vector (world down for D4)
     * @returns Quaternion representing the required rotation
     */
    private calculateRotationToAlignVectors(from: CANNON.Vec3, to: CANNON.Vec3): CANNON.Quaternion {
        // Normalize both vectors (in-place)
        const fromNorm = from.clone();
        fromNorm.normalize();
        const toNorm = to.clone();
        toNorm.normalize();

        // Calculate the dot product
        const dot = fromNorm.dot(toNorm);

        // If vectors are already aligned, return identity quaternion
        if (Math.abs(dot - 1.0) < 0.000001) {
            return new CANNON.Quaternion(0, 0, 0, 1);
        }

        // If vectors are opposite, find a perpendicular axis
        if (Math.abs(dot + 1.0) < 0.000001) {
            // Find a perpendicular vector
            let axis = new CANNON.Vec3(1, 0, 0);
            if (Math.abs(fromNorm.x) > 0.9) {
                axis = new CANNON.Vec3(0, 1, 0);
            }

            // Create perpendicular axis
            const crossResult = new CANNON.Vec3();
            fromNorm.cross(axis, crossResult);
            crossResult.normalize();

            // Return 180-degree rotation around this axis
            return new CANNON.Quaternion(crossResult.x, crossResult.y, crossResult.z, 0);
        }

        // Calculate rotation axis (cross product)
        const axis = new CANNON.Vec3();
        fromNorm.cross(toNorm, axis);
        axis.normalize();

        // Calculate rotation angle
        const angle = Math.acos(PhysicsUtils.clamp(dot, -1, 1));

        // Create quaternion from axis-angle
        const halfAngle = angle * 0.5;
        const sin = Math.sin(halfAngle);

        return new CANNON.Quaternion(
            axis.x * sin,
            axis.y * sin,
            axis.z * sin,
            Math.cos(halfAngle)
        );
    }

    /**
     * Gets a random initial rotation for natural dice throws
     * @returns Random quaternion for varied dice starting orientations
     */
    public getRandomRotation(): CANNON.Quaternion {
        // Generate random Euler angles
        const x = PhysicsUtils.randomBetween(0, Math.PI * 2);
        const y = PhysicsUtils.randomBetween(0, Math.PI * 2);
        const z = PhysicsUtils.randomBetween(0, Math.PI * 2);

        // Convert to quaternion
        const threeQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
        return PhysicsUtils.threeQuaternionToCannon(threeQuaternion);
    }

    /**
     * Applies a random throw force and rotation to the dice
     * Simulates a natural dice throw with realistic physics
     * D4 dice are typically thrown with more care due to their sharp points
     * @param throwForce - Optional force multiplier (default: 0.8 for gentler D4 throws)
     * @param throwPosition - Optional starting position (default: above center)
     */
    public throwDice(throwForce: number = 0.8, throwPosition?: THREE.Vector3): void {
        // Set starting position (above the table by default)
        // D4 starts a bit lower than D6 due to smaller size
        const startPos = throwPosition || new THREE.Vector3(
            PhysicsUtils.randomBetween(-2, 2),
            PhysicsUtils.randomBetween(2.5, 4),
            PhysicsUtils.randomBetween(-2, 2)
        );
        this.setPosition(startPos);

        // Set random initial rotation
        this.body.quaternion.copy(this.getRandomRotation());
        this.object.quaternion.copy(PhysicsUtils.cannonQuaternionToThree(this.body.quaternion));

        // Apply random throw forces (gentler for D4 due to sharp edges)
        const force = new CANNON.Vec3(
            PhysicsUtils.randomBetween(-4, 4) * throwForce,
            PhysicsUtils.randomBetween(-1.5, 0.5) * throwForce, // Less upward force
            PhysicsUtils.randomBetween(-4, 4) * throwForce
        );

        // Apply random angular velocity for spinning effect
        const angularVelocity = new CANNON.Vec3(
            PhysicsUtils.randomBetween(-15, 15) * throwForce,
            PhysicsUtils.randomBetween(-15, 15) * throwForce,
            PhysicsUtils.randomBetween(-15, 15) * throwForce
        );

        // Apply forces to the dice
        this.body.velocity.copy(force);
        this.body.angularVelocity.copy(angularVelocity);

        // Add gentle random spawn force for dynamic entry
        const spawnForce = new CANNON.Vec3(
            PhysicsUtils.randomBetween(-3, 3),
            PhysicsUtils.randomBetween(0, 1.5),
            PhysicsUtils.randomBetween(-3, 3)
        );
        this.body.velocity.vadd(spawnForce, this.body.velocity);

        // Mark as part of active simulation
        this.simulationRunning = true;
    }

    /**
     * Gets the number of possible values for this dice type
     * @returns Number of faces/values (4 for D4)
     */
    public get values(): number {
        return 4;
    }

    /**
     * Gets the minimum possible value for this dice type
     * @returns Minimum value (1 for D4)
     */
    public get minValue(): number {
        return 1;
    }

    /**
     * Gets the maximum possible value for this dice type
     * @returns Maximum value (4 for D4)
     */
    public get maxValue(): number {
        return 4;
    }

    /**
     * Gets the type identifier for this dice
     * @returns String identifier ("d4")
     */
    public get diceType(): string {
        return 'd4';
    }

    /**
     * Creates multiple D4 dice with the same options
     * @param count - Number of dice to create
     * @param options - Shared options for all dice
     * @returns Array of DiceD4 instances
     */
    static createMultiple(count: number, options: DiceOptions = {}): DiceD4[] {
        const dice: DiceD4[] = [];
        for (let i = 0; i < count; i++) {
            dice.push(new DiceD4(options));
        }
        return dice;
    }
} 