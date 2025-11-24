import { DiceObject } from '../DiceObject';
import type { DiceOptions } from '../types/DiceTypes';
import { D10Geometry, D10FaceValues, D10FaceNormals, validateD10Geometry } from './geometries/D10Geometry';
import { PhysicsUtils } from '../utils/PhysicsUtils';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Ten-sided die (D10) implementation
 * 
 * D10 is a pentagonal trapezohedron (deltohedron) - NOT a regular polyhedron
 * It has 10 kite-shaped faces numbered 1-10 and 10 triangular connector faces
 * 
 * Key characteristics:
 * - 12 vertices (10 circumference + 2 polar)
 * - 20 faces (10 kite + 10 triangular)
 * - Values 1-10 on the kite-shaped faces
 * - Standard reading (top face up, not inverted like D4)
 * - Unique barrel-like shape with alternating vertex heights
 * 
 * Based on the original threejs-dice implementation
 */
export class DiceD10 extends DiceObject {
    public readonly diceType = 'd10' as const;

    constructor(options: Partial<DiceOptions> = {}) {
        // Validate geometry before creating the dice
        if (!validateD10Geometry()) {
            throw new Error('D10 geometry validation failed');
        }

        super(D10Geometry, {
            size: 1,
            ...options
        });

        console.log('🎲 Creating D10 dice with options:', this.options);
    }

    protected createGeometry(): THREE.BufferGeometry {
        console.log('🎲 Creating D10 geometry...');

        const geometry = new THREE.BufferGeometry();
        const size = this.options.size;
        const scaleFactor = D10Geometry.scaleFactor;

        // Get vertices and faces from geometry definition
        const vertices = D10Geometry.vertices;
        const faces = D10Geometry.faces;

        console.log('🎲 D10 geometry data:', {
            vertexCount: vertices.length,
            faceCount: faces.length,
            scaleFactor,
            size
        });

        // Build triangulated geometry
        // D10 has mixed face types: kite-shaped (4 vertices) and triangular (3 vertices)
        const triangulatedFaces = [];

        for (let i = 0; i < faces.length; i++) {
            const face = faces[i];

            if (face.length === 4) {
                // Kite-shaped face: triangulate as [v0,v1,v2] and [v0,v2,v3]
                triangulatedFaces.push([face[0], face[1], face[2]]);
                triangulatedFaces.push([face[0], face[2], face[3]]);
            } else if (face.length === 3) {
                // Triangular face: use as-is
                triangulatedFaces.push([face[0], face[1], face[2]]);
            } else {
                console.warn(`🎲 D10 face ${i} has unexpected vertex count: ${face.length}`);
            }
        }

        console.log('🎲 D10 triangulated faces:', triangulatedFaces.length);

        // Build vertex array for BufferGeometry
        const positions = new Float32Array(triangulatedFaces.length * 9); // 3 vertices * 3 coords per triangle
        const normals = new Float32Array(triangulatedFaces.length * 9);
        const uvs = new Float32Array(triangulatedFaces.length * 6); // 3 vertices * 2 coords per triangle

        for (let faceIndex = 0; faceIndex < triangulatedFaces.length; faceIndex++) {
            const face = triangulatedFaces[faceIndex];
            const positionOffset = faceIndex * 9;
            const uvOffset = faceIndex * 6;

            // Get the three vertices of this triangle
            const v1 = new THREE.Vector3(
                vertices[face[0]][0] * size * scaleFactor,
                vertices[face[0]][1] * size * scaleFactor,
                vertices[face[0]][2] * size * scaleFactor
            );
            const v2 = new THREE.Vector3(
                vertices[face[1]][0] * size * scaleFactor,
                vertices[face[1]][1] * size * scaleFactor,
                vertices[face[1]][2] * size * scaleFactor
            );
            const v3 = new THREE.Vector3(
                vertices[face[2]][0] * size * scaleFactor,
                vertices[face[2]][1] * size * scaleFactor,
                vertices[face[2]][2] * size * scaleFactor
            );

            // Set vertex positions
            positions[positionOffset] = v1.x;
            positions[positionOffset + 1] = v1.y;
            positions[positionOffset + 2] = v1.z;
            positions[positionOffset + 3] = v2.x;
            positions[positionOffset + 4] = v2.y;
            positions[positionOffset + 5] = v2.z;
            positions[positionOffset + 6] = v3.x;
            positions[positionOffset + 7] = v3.y;
            positions[positionOffset + 8] = v3.z;

            // Calculate face normal
            const normal = new THREE.Vector3()
                .crossVectors(v2.clone().sub(v1), v3.clone().sub(v1))
                .normalize();

            // Set normals (same for all three vertices)
            normals[positionOffset] = normal.x;
            normals[positionOffset + 1] = normal.y;
            normals[positionOffset + 2] = normal.z;
            normals[positionOffset + 3] = normal.x;
            normals[positionOffset + 4] = normal.y;
            normals[positionOffset + 5] = normal.z;
            normals[positionOffset + 6] = normal.x;
            normals[positionOffset + 7] = normal.y;
            normals[positionOffset + 8] = normal.z;

            // Set UV coordinates (simple mapping)
            uvs[uvOffset] = 0;
            uvs[uvOffset + 1] = 0;
            uvs[uvOffset + 2] = 1;
            uvs[uvOffset + 3] = 0;
            uvs[uvOffset + 4] = 0.5;
            uvs[uvOffset + 5] = 1;
        }

        // Set geometry attributes
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        // Compute bounding sphere
        geometry.computeBoundingSphere();

        console.log('🎲 D10 geometry created:', {
            triangles: triangulatedFaces.length,
            vertices: positions.length / 3,
            boundingSphere: geometry.boundingSphere?.radius
        });

        return geometry;
    }

    protected createPhysicsShape(): CANNON.Shape {
        console.log('🎲 Creating D10 physics shape...');

        const vertices = D10Geometry.vertices;
        const faces = D10Geometry.faces;
        const size = this.options.size;
        const scaleFactor = D10Geometry.scaleFactor;

        // Convert vertices to CANNON.Vec3 format
        const cannonVertices = vertices.map((vertex: number[]) =>
            new CANNON.Vec3(
                vertex[0] * size * scaleFactor,
                vertex[1] * size * scaleFactor,
                vertex[2] * size * scaleFactor
            )
        );

        // Convert faces to the format expected by ConvexPolyhedron
        // Note: ConvexPolyhedron expects faces as arrays of vertex indices
        const cannonFaces = faces.map((face: number[]) => [...face]); // Copy face arrays

        console.log('🎲 D10 physics shape data:', {
            vertices: cannonVertices.length,
            faces: cannonFaces.length,
            scaleFactor,
            size
        });

        // Create ConvexPolyhedron shape
        const shape = new CANNON.ConvexPolyhedron({
            vertices: cannonVertices,
            faces: cannonFaces
        });

        console.log('🎲 D10 ConvexPolyhedron created');
        return shape;
    }

    public calculateUpperValue(): number {
        if (!this.body) {
            console.warn('🎲 D10 body not available for value reading');
            return 1;
        }

        // D10 uses standard reading - find the face pointing most upward (away from gravity)
        const upVector = new THREE.Vector3(0, 1, 0); // Gravity points down, so up is positive Y
        let closestFaceIndex = 0;
        let smallestAngle = Math.PI;

        // Only check the first 10 faces (kite-shaped faces with values)
        // The triangular faces (indices 10-19) don't have values
        for (let i = 0; i < 10; i++) {
            const faceNormal = new THREE.Vector3(
                D10FaceNormals[i][0],
                D10FaceNormals[i][1],
                D10FaceNormals[i][2]
            );

            // Transform normal by dice rotation
            faceNormal.applyQuaternion(
                new THREE.Quaternion(
                    this.body.quaternion.x,
                    this.body.quaternion.y,
                    this.body.quaternion.z,
                    this.body.quaternion.w
                )
            );

            // Calculate angle between face normal and up vector
            const angle = faceNormal.angleTo(upVector);

            if (angle < smallestAngle) {
                smallestAngle = angle;
                closestFaceIndex = i;
            }
        }

        const value = D10FaceValues[closestFaceIndex] || 1;

        console.log('🎲 D10 face reading:', {
            faceIndex: closestFaceIndex,
            value,
            angle: (smallestAngle * 180 / Math.PI).toFixed(1) + '°'
        });

        return value;
    }

    public shiftUpperValue(targetValue: number): void {
        if (!this.body) {
            console.warn('🎲 Cannot shift D10 value - no physics body');
            return;
        }

        if (targetValue < 1 || targetValue > 10) {
            console.warn('🎲 D10 target value must be between 1 and 10');
            return;
        }

        console.log('🎲 Shifting D10 to show value:', targetValue);

        // For D10, we need to orient the dice so the target face is pointing up
        // This is more complex than other dice due to the kite-shaped faces
        // For now, we'll use a simple approach and just reset to a known orientation

        // Reset rotation to identity
        this.body.quaternion.set(0, 0, 0, 1);

        // Apply a rotation to show the desired face
        // This is a simplified approach - in a full implementation, we'd calculate
        // the exact rotation needed to orient the target face upward
        const rotationAngle = ((targetValue - 1) * Math.PI * 2) / 10;
        this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotationAngle);

        console.log('🎲 D10 shifted to target value:', targetValue);
    }

    public getUpsideValue(): number {
        return this.calculateUpperValue();
    }

    public throwDice(force: number = 1.0): void {
        if (!this.body) {
            console.warn('🎲 Cannot throw D10 - no physics body');
            return;
        }

        console.log('🎲 Throwing D10 with force:', force);

        // Apply random impulse and angular velocity
        const throwForce = force * 8; // Base throwing force
        const randomDirection = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() * 0.5 + 0.3, // Upward bias
            (Math.random() - 0.5) * 2
        ).normalize();

        // Apply linear impulse
        this.body.velocity.set(
            randomDirection.x * throwForce,
            randomDirection.y * throwForce,
            randomDirection.z * throwForce
        );

        // Apply random angular velocity
        this.body.angularVelocity.set(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20
        );

        // Add gentle random spawn force for dynamic entry
        const spawnForce = new CANNON.Vec3(
            PhysicsUtils.randomBetween(-4.5, 4.5),
            PhysicsUtils.randomBetween(0, 2.5),
            PhysicsUtils.randomBetween(-4.5, 4.5)
        );
        this.body.velocity.vadd(spawnForce, this.body.velocity);

        // Wake up the physics body
        this.body.wakeUp();

        console.log('🎲 D10 thrown:', {
            velocity: this.body.velocity,
            angularVelocity: this.body.angularVelocity
        });
    }
} 