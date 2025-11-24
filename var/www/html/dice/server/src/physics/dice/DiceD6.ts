import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DiceObject } from '../DiceObject';
import type { DiceOptions } from '../types/DiceTypes';
import { PhysicsUtils } from '../utils/PhysicsUtils';
import { D6Geometry, D6FaceValues, D6ValueToFace, D6FaceNormals, validateD6Geometry } from './geometries/D6Geometry';

/**
 * Six-sided dice (D6) implementation
 * Standard cube dice with values 1-6, where opposite faces sum to 7
 */
export class DiceD6 extends DiceObject {

    /**
     * Creates a new D6 dice instance
     * @param options - Configuration options for the dice appearance and behavior
     * @throws Error if D6 geometry validation fails
     */
    constructor(options: DiceOptions = {}) {
        // Validate geometry before creating the dice
        if (!validateD6Geometry()) {
            throw new Error('D6 geometry validation failed');
        }

        // Call parent constructor with D6 geometry
        super(D6Geometry, options);
    }

    /**
     * Calculates which face is currently facing up based on the dice orientation
     * Uses gravity direction and face normals to determine the uppermost face
     * @returns The value (1-6) of the face currently facing up
     */
    protected calculateUpperValue(): number {
        // Get the current rotation of the dice
        const quaternion = this.body.quaternion;

        // Transform the up vector (gravity direction) by the dice rotation
        const upVector = new CANNON.Vec3(0, 1, 0); // World up direction
        const localUpVector = quaternion.inverse().vmult(upVector, new CANNON.Vec3());

        // Find which face normal is most aligned with the up direction
        let maxDot = -Infinity;
        let upFaceIndex = 0;

        for (let i = 0; i < D6FaceNormals.length; i++) {
            const normal = new CANNON.Vec3(
                D6FaceNormals[i][0],
                D6FaceNormals[i][1],
                D6FaceNormals[i][2]
            );

            // Calculate dot product to see how aligned this face is with "up"
            const dot = localUpVector.dot(normal);

            if (dot > maxDot) {
                maxDot = dot;
                upFaceIndex = i;
            }
        }

        // Return the value corresponding to the upward-facing face
        return D6FaceValues[upFaceIndex];
    }

    /**
     * Rotates the dice to show a specific value facing up
     * Calculates the required rotation to position the desired face upward
     * @param targetValue - The value (1-6) that should be facing up
     * @throws Error if targetValue is not between 1 and 6
     */
    public shiftUpperValue(targetValue: number): void {
        // Validate the target value
        PhysicsUtils.validateDiceValue(targetValue, 1, 6);

        // Get the face index for the target value
        const targetFaceIndex = D6ValueToFace[targetValue];

        if (targetFaceIndex === undefined) {
            throw new Error(`Invalid D6 value: ${targetValue}. Must be between 1 and 6.`);
        }

        // Get the normal vector for the target face
        const targetNormal = new CANNON.Vec3(
            D6FaceNormals[targetFaceIndex][0],
            D6FaceNormals[targetFaceIndex][1],
            D6FaceNormals[targetFaceIndex][2]
        );

        // Calculate rotation needed to align this face normal with world up (0, 1, 0)
        const worldUp = new CANNON.Vec3(0, 1, 0);
        const quaternion = this.calculateRotationToAlignVectors(targetNormal, worldUp);

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
     * @param to - The target vector (world up)
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
     * @param throwForce - Optional force multiplier (default: 1.0)
     * @param throwPosition - Optional starting position (default: above center)
     */
    public throwDice(throwForce: number = 1.0, throwPosition?: THREE.Vector3): void {
        // Set starting position (above the table by default)
        const startPos = throwPosition || new THREE.Vector3(
            PhysicsUtils.randomBetween(-2, 2),
            PhysicsUtils.randomBetween(3, 5),
            PhysicsUtils.randomBetween(-2, 2)
        );
        this.setPosition(startPos);

        // Set random initial rotation
        this.body.quaternion.copy(this.getRandomRotation());
        this.object.quaternion.copy(PhysicsUtils.cannonQuaternionToThree(this.body.quaternion));

        // Apply random throw forces
        const force = new CANNON.Vec3(
            PhysicsUtils.randomBetween(-5, 5) * throwForce,
            PhysicsUtils.randomBetween(-2, 1) * throwForce, // Slight downward bias
            PhysicsUtils.randomBetween(-5, 5) * throwForce
        );
        this.body.velocity.copy(force);

        // Apply random angular velocity for spinning
        const angularVel = new CANNON.Vec3(
            PhysicsUtils.randomBetween(-10, 10) * throwForce,
            PhysicsUtils.randomBetween(-10, 10) * throwForce,
            PhysicsUtils.randomBetween(-10, 10) * throwForce
        );
        this.body.angularVelocity.copy(angularVel);

        // Add gentle random spawn force for dynamic entry
        const spawnForce = new CANNON.Vec3(
            PhysicsUtils.randomBetween(-4, 4),
            PhysicsUtils.randomBetween(0, 2),
            PhysicsUtils.randomBetween(-4, 4)
        );
        this.body.velocity.vadd(spawnForce, this.body.velocity);

        // Ensure the body is awake and ready for physics simulation
        this.body.wakeUp();
    }

    /**
     * Gets the number of faces on this dice type
     * @returns Always 6 for D6
     */
    public get values(): number {
        return 6;
    }

    /**
     * Gets the minimum possible value for this dice
     * @returns Always 1 for D6
     */
    public get minValue(): number {
        return 1;
    }

    /**
     * Gets the maximum possible value for this dice
     * @returns Always 6 for D6
     */
    public get maxValue(): number {
        return 6;
    }

    /**
     * Gets the type name of this dice
     * @returns "d6" string identifier
     */
    public get diceType(): string {
        return 'd6';
    }

    /**
     * Creates a factory function for generating multiple D6 dice
     * @param count - Number of dice to create
     * @param options - Shared options for all dice
     * @returns Array of D6 dice instances
     */
    static createMultiple(count: number, options: DiceOptions = {}): DiceD6[] {
        const dice: DiceD6[] = [];

        for (let i = 0; i < count; i++) {
            dice.push(new DiceD6(options));
        }

        return dice;
    }
} 