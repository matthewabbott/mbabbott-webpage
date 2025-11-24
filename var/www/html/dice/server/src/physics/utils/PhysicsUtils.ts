import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Utility functions for physics operations and conversions
 */
export class PhysicsUtils {

    /**
     * Converts a Three.js Vector3 to a Cannon.js Vec3
     * @param threeVector - The Three.js Vector3 to convert
     * @returns Cannon.js Vec3 equivalent
     */
    static threeVectorToCannon(threeVector: THREE.Vector3): CANNON.Vec3 {
        return new CANNON.Vec3(threeVector.x, threeVector.y, threeVector.z);
    }

    /**
     * Converts a Cannon.js Vec3 to a Three.js Vector3
     * @param cannonVector - The Cannon.js Vec3 to convert
     * @returns Three.js Vector3 equivalent
     */
    static cannonVectorToThree(cannonVector: CANNON.Vec3): THREE.Vector3 {
        return new THREE.Vector3(cannonVector.x, cannonVector.y, cannonVector.z);
    }

    /**
     * Converts a Three.js Quaternion to a Cannon.js Quaternion
     * @param threeQuaternion - The Three.js Quaternion to convert
     * @returns Cannon.js Quaternion equivalent
     */
    static threeQuaternionToCannon(threeQuaternion: THREE.Quaternion): CANNON.Quaternion {
        return new CANNON.Quaternion(
            threeQuaternion.x,
            threeQuaternion.y,
            threeQuaternion.z,
            threeQuaternion.w
        );
    }

    /**
     * Converts a Cannon.js Quaternion to a Three.js Quaternion
     * @param cannonQuaternion - The Cannon.js Quaternion to convert
     * @returns Three.js Quaternion equivalent
     */
    static cannonQuaternionToThree(cannonQuaternion: CANNON.Quaternion): THREE.Quaternion {
        return new THREE.Quaternion(
            cannonQuaternion.x,
            cannonQuaternion.y,
            cannonQuaternion.z,
            cannonQuaternion.w
        );
    }

    /**
     * Creates a Cannon.js ConvexPolyhedron from a Three.js BufferGeometry
     * @param geometry - The Three.js BufferGeometry to convert
     * @returns Cannon.js ConvexPolyhedron shape
     * @throws Error if geometry conversion fails
     */
    static createConvexPolyhedronFromGeometry(geometry: THREE.BufferGeometry): CANNON.ConvexPolyhedron {
        try {
            const position = geometry.attributes.position as THREE.BufferAttribute;
            const vertices: THREE.Vector3[] = [];

            // Extract vertices from BufferGeometry
            for (let i = 0; i < position.count; i++) {
                vertices.push(new THREE.Vector3().fromBufferAttribute(position, i));
            }

            // Remove duplicate vertices and create mapping
            const verticesMap: { [key: string]: number } = {};
            const uniqueVertices: CANNON.Vec3[] = [];
            const indexMapping: number[] = [];

            for (let i = 0; i < vertices.length; i++) {
                const v = vertices[i];
                const key = `${Math.round(v.x * 100)}_${Math.round(v.y * 100)}_${Math.round(v.z * 100)}`;

                if (verticesMap[key] === undefined) {
                    verticesMap[key] = uniqueVertices.length;
                    uniqueVertices.push(new CANNON.Vec3(v.x, v.y, v.z));
                    indexMapping[i] = uniqueVertices.length - 1;
                } else {
                    indexMapping[i] = verticesMap[key];
                }
            }

            // Create faces from triangles
            const faces: number[][] = [];
            for (let i = 0; i < vertices.length; i += 3) {
                const face = [
                    indexMapping[i],
                    indexMapping[i + 1],
                    indexMapping[i + 2]
                ];

                // Only add face if vertices are not duplicated
                if (face[0] !== face[1] && face[1] !== face[2] && face[0] !== face[2]) {
                    faces.push(face);
                }
            }

            return new CANNON.ConvexPolyhedron({
                vertices: uniqueVertices,
                faces: faces
            });
        } catch (error) {
            throw new Error(`Failed to create ConvexPolyhedron from geometry: ${error}`);
        }
    }

    /**
     * Creates a Cannon.js Trimesh from a Three.js BufferGeometry
     * @param geometry - The Three.js BufferGeometry to convert
     * @returns Cannon.js Trimesh shape
     * @throws Error if geometry conversion fails
     */
    static createTrimeshFromGeometry(geometry: THREE.BufferGeometry): CANNON.Trimesh {
        try {
            let vertices: Float32Array;

            if (geometry.index === null) {
                // Non-indexed geometry
                vertices = (geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
            } else {
                // Indexed geometry - convert to non-indexed
                const clonedGeometry = geometry.clone().toNonIndexed();
                vertices = (clonedGeometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
            }

            const indices = Array.from({ length: vertices.length / 3 }, (_, i) => i);

            return new CANNON.Trimesh(vertices as unknown as number[], indices);
        } catch (error) {
            throw new Error(`Failed to create Trimesh from geometry: ${error}`);
        }
    }

    /**
     * Creates a Cannon.js Box shape with proper half-extents
     * @param width - Width of the box
     * @param height - Height of the box
     * @param depth - Depth of the box
     * @returns Cannon.js Box shape
     */
    static createBoxShape(width: number, height: number, depth: number): CANNON.Box {
        return new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5));
    }

    /**
     * Creates a Cannon.js Sphere shape
     * @param radius - Radius of the sphere
     * @returns Cannon.js Sphere shape
     */
    static createSphereShape(radius: number): CANNON.Sphere {
        return new CANNON.Sphere(radius);
    }

    /**
     * Creates a Cannon.js Cylinder shape
     * @param radiusTop - Radius at the top
     * @param radiusBottom - Radius at the bottom
     * @param height - Height of the cylinder
     * @param numSegments - Number of segments (optional)
     * @returns Cannon.js Cylinder shape
     */
    static createCylinderShape(
        radiusTop: number,
        radiusBottom: number,
        height: number,
        numSegments: number = 8
    ): CANNON.Cylinder {
        return new CANNON.Cylinder(radiusTop, radiusBottom, height, numSegments);
    }

    /**
     * Creates a Cannon.js Plane shape
     * @returns Cannon.js Plane shape
     */
    static createPlaneShape(): CANNON.Plane {
        return new CANNON.Plane();
    }

    /**
     * Validates that a value is within the valid range for a dice type
     * @param value - The value to validate
     * @param minValue - Minimum valid value (usually 1)
     * @param maxValue - Maximum valid value (depends on dice type)
     * @throws Error if value is outside valid range
     */
    static validateDiceValue(value: number, minValue: number, maxValue: number): void {
        if (!Number.isInteger(value)) {
            throw new Error(`Dice value must be an integer, got: ${value}`);
        }

        if (value < minValue || value > maxValue) {
            throw new Error(
                `Dice value ${value} is outside valid range [${minValue}, ${maxValue}]`
            );
        }
    }

    /**
     * Calculates the next power of 2 for texture sizes
     * @param value - Input value
     * @returns Next power of 2 that is >= value, minimum 128
     */
    static calculateTextureSize(value: number): number {
        const size = Math.max(128, Math.pow(2, Math.ceil(Math.log2(value))));
        return size;
    }

    /**
     * Clamps a value between min and max
     * @param value - Value to clamp
     * @param min - Minimum value
     * @param max - Maximum value
     * @returns Clamped value
     */
    static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Generates a random value between min and max (inclusive)
     * @param min - Minimum value
     * @param max - Maximum value
     * @returns Random value between min and max
     */
    static randomBetween(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    /**
     * Generates a random integer between min and max (inclusive)
     * @param min - Minimum integer
     * @param max - Maximum integer
     * @returns Random integer between min and max
     */
    static randomIntBetween(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Disposes of a Cannon.js body and removes it from the world
     * @param world - Physics world
     * @param body - Body to dispose
     */
    static disposeBody(world: CANNON.World, body: CANNON.Body): void {
        try {
            world.removeBody(body);
            // Note: Cannon.js bodies don't have explicit disposal methods
            // Memory will be garbage collected when references are removed
        } catch (error) {
            console.warn('Error disposing physics body:', error);
        }
    }

    /**
     * Gets the upward-facing normal vector for the current orientation
     * @param quaternion - Current rotation quaternion
     * @param invertUpside - Whether to invert the up direction (for dice like D4)
     * @returns Upward-facing unit vector
     */
    static getUpwardVector(quaternion: CANNON.Quaternion, invertUpside: boolean = false): CANNON.Vec3 {
        const upVector = new CANNON.Vec3(0, invertUpside ? -1 : 1, 0);
        return quaternion.vmult(upVector, new CANNON.Vec3());
    }
} 