import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DiceObject } from '../DiceObject';
import type { DiceOptions } from '../types/DiceTypes';
import { PhysicsUtils } from '../utils/PhysicsUtils';
import { D20Geometry, D20FaceValues, D20ValueToFace, D20FaceNormals, validateD20Geometry } from './geometries/D20Geometry';

/**
 * Twenty-sided dice (D20) implementation
 * Icosahedron dice with values 1-20, where the value is read from the TOP face
 * D20 dice use standard reading (like D6/D8) - the face pointing up shows the value
 * D20 is the iconic TTRPG dice, particularly in D&D systems
 */
export class DiceD20 extends DiceObject {

    /**
     * Creates a new D20 dice instance
     * @param options - Configuration options for the dice appearance and behavior
     * @throws Error if D20 geometry validation fails
     */
    constructor(options: DiceOptions = {}) {
        // Validate geometry before creating the dice
        if (!validateD20Geometry()) {
            throw new Error('D20 geometry validation failed');
        }

        // Call parent constructor with D20 geometry
        super(D20Geometry, options);
    }

    /**
     * Calculates which value is currently showing based on the dice orientation
     * For D20, we find which face is pointing UP (away from gravity)
     * since the value is read from the top face (standard dice reading)
     * @returns The value (1-20) of the face currently facing up
     */
    protected calculateUpperValue(): number {
        // Get the current rotation of the dice
        const quaternion = this.body.quaternion;

        // Transform the up vector (opposite gravity direction) by the dice rotation
        // We want to find which face normal is most aligned with the UP direction
        const upVector = new CANNON.Vec3(0, 1, 0); // World up direction
        const localUpVector = quaternion.inverse().vmult(upVector, new CANNON.Vec3());

        // Find which face normal is most aligned with the up direction
        let maxDot = -Infinity;
        let upFaceIndex = 0;

        for (let i = 0; i < D20FaceNormals.length; i++) {
            const normal = new CANNON.Vec3(
                D20FaceNormals[i][0],
                D20FaceNormals[i][1],
                D20FaceNormals[i][2]
            );

            // Calculate dot product to see how aligned this face is with "up"
            // For D20, we want the face normal pointing most strongly upward
            const dot = localUpVector.dot(normal);

            if (dot > maxDot) {
                maxDot = dot;
                upFaceIndex = i;
            }
        }

        // Return the value corresponding to the upward-facing face
        // This is standard dice reading - we read the top face
        return D20FaceValues[upFaceIndex];
    }

    /**
     * Rotates the dice to show a specific value facing up
     * For D20, we position the dice so the desired value face is pointing upward
     * @param targetValue - The value (1-20) that should be facing up
     * @throws Error if targetValue is not between 1 and 20
     */
    public shiftUpperValue(targetValue: number): void {
        // Validate the target value
        PhysicsUtils.validateDiceValue(targetValue, 1, 20);

        // Get the face index for the target value
        const targetFaceIndex = D20ValueToFace[targetValue];

        if (targetFaceIndex === undefined) {
            throw new Error(`Invalid D20 value: ${targetValue}. Must be between 1 and 20.`);
        }

        // Get the normal vector for the target face
        const targetNormal = new CANNON.Vec3(
            D20FaceNormals[targetFaceIndex][0],
            D20FaceNormals[targetFaceIndex][1],
            D20FaceNormals[targetFaceIndex][2]
        );

        // Calculate rotation needed to align this face normal with world up (0, 1, 0)
        // For D20, we want the face normal to point upward so the face is on top
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
     * @param to - The target vector (world up for D20)
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
     * D20 dice roll excellently due to their near-spherical icosahedron shape
     * @param throwForce - Optional force multiplier (default: 1.2 for strong D20 throws)
     * @param throwPosition - Optional starting position (default: above center)
     */
    public throwDice(throwForce: number = 1.2, throwPosition?: THREE.Vector3): void {
        // Set starting position (above the table by default)
        // D20 starts at higher position due to larger size and dramatic rolls
        const startPos = throwPosition || new THREE.Vector3(
            PhysicsUtils.randomBetween(-2.5, 2.5),
            PhysicsUtils.randomBetween(4, 6),
            PhysicsUtils.randomBetween(-2.5, 2.5)
        );
        this.setPosition(startPos);

        // Set random initial rotation
        this.body.quaternion.copy(this.getRandomRotation());
        this.updateMesh();

        // Apply random throw forces
        // D20 benefits from strong throws due to excellent rolling characteristics
        const forceX = PhysicsUtils.randomBetween(-10, 10) * throwForce;
        const forceY = PhysicsUtils.randomBetween(3, 8) * throwForce;
        const forceZ = PhysicsUtils.randomBetween(-10, 10) * throwForce;

        // Apply random angular velocities for realistic tumbling
        // D20 can handle high angular velocities due to symmetric shape
        const angularX = PhysicsUtils.randomBetween(-20, 20) * throwForce;
        const angularY = PhysicsUtils.randomBetween(-20, 20) * throwForce;
        const angularZ = PhysicsUtils.randomBetween(-20, 20) * throwForce;

        // Apply forces to the physics body
        this.body.velocity.set(forceX, forceY, forceZ);
        this.body.angularVelocity.set(angularX, angularY, angularZ);

        // Add gentle random spawn force for dynamic entry
        const spawnForce = new CANNON.Vec3(
            PhysicsUtils.randomBetween(-5, 5),
            PhysicsUtils.randomBetween(0, 3),
            PhysicsUtils.randomBetween(-5, 5)
        );
        this.body.velocity.vadd(spawnForce, this.body.velocity);

        // Wake up the body to ensure it participates in physics simulation
        this.body.wakeUp();

        console.log(`🎲 D20 thrown with force: [${forceX.toFixed(2)}, ${forceY.toFixed(2)}, ${forceZ.toFixed(2)}], angular: [${angularX.toFixed(2)}, ${angularY.toFixed(2)}, ${angularZ.toFixed(2)}]`);
    }

    /**
     * Gets the valid values for this dice type
     * @returns The maximum value this dice can show (20 for D20)
     */
    public get values(): number {
        return 20;
    }

    /**
     * Gets the minimum value this dice can show
     * @returns The minimum value (1 for D20)
     */
    public get minValue(): number {
        return 1;
    }

    /**
     * Gets the maximum value this dice can show
     * @returns The maximum value (20 for D20)
     */
    public get maxValue(): number {
        return 20;
    }

    /**
     * Gets the dice type identifier
     * @returns String identifier for this dice type
     */
    public get diceType(): string {
        return 'd20';
    }

    /**
     * Creates multiple D20 dice instances with identical options
     * @param count - Number of dice to create
     * @param options - Options to apply to all dice
     * @returns Array of D20 dice instances
     */
    static createMultiple(count: number, options: DiceOptions = {}): DiceD20[] {
        const dice: DiceD20[] = [];
        for (let i = 0; i < count; i++) {
            dice.push(new DiceD20(options));
        }
        return dice;
    }
} 