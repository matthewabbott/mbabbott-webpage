import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { DiceOptions, DiceGeometry, DiceVectors } from './types/DiceTypes';
import { PhysicsUtils } from './utils/PhysicsUtils';
import { DiceManager } from './DiceManager';

/**
 * Base class for all dice objects
 * Handles Three.js mesh creation, physics body management, and value determination
 */
export abstract class DiceObject {
    /** The Three.js mesh representing the dice visually */
    public object: THREE.Mesh;

    /** The Cannon.js body for physics simulation */
    public body: CANNON.Body;

    /** Configuration options for this dice */
    public options: Required<DiceOptions>;

    /** Geometry definition for this dice type */
    protected geometry: DiceGeometry;

    /** Whether the dice is currently part of an active simulation */
    public simulationRunning: boolean = false;

    /** Cache for face textures to avoid regeneration */
    private textureCache: Map<string, THREE.Texture> = new Map();

    /** Default configuration options */
    private static readonly defaultOptions: Required<DiceOptions> = {
        size: 100,
        fontColor: '#000000',
        backColor: '#ffffff',
        customTextTextureFunction: DiceObject.createTextTexture
    };

    /**
     * Creates a new dice object
     * @param geometry - Geometry definition for this dice type
     * @param options - Configuration options for the dice
     * @throws Error if DiceManager is not initialized
     */
    constructor(geometry: DiceGeometry, options: DiceOptions = {}) {
        if (!DiceManager.isInitialized()) {
            throw new Error('DiceManager must be initialized before creating dice objects');
        }

        this.geometry = geometry;
        this.options = { ...DiceObject.defaultOptions, ...options };

        // Create Three.js mesh
        this.object = this.createMesh();

        // Create Cannon.js body
        this.body = this.createBody();

        // Link Three.js object and physics body
        this.object.userData.body = this.body;
        (this.body as any).userData = { object: this.object };

        // Add to physics world
        DiceManager.addBody(this.body);
    }

    /**
     * Creates the Three.js mesh with geometry and materials
     * @returns The created Three.js mesh
     */
    private createMesh(): THREE.Mesh {
        // Create the dice geometry
        const threeGeometry = this.createThreeGeometry();

        // Create materials for each face
        const materials = this.createFaceMaterials();

        // Create the mesh
        const mesh = new THREE.Mesh(threeGeometry, materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }

    /**
     * Creates the Three.js geometry from the dice geometry definition
     * @returns BufferGeometry for the dice
     */
    private createThreeGeometry(): THREE.BufferGeometry {
        const vertices: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];

        // Process each face in the geometry definition
        for (let faceIndex = 0; faceIndex < this.geometry.faces.length; faceIndex++) {
            const face = this.geometry.faces[faceIndex];

            // Get vertices for this face
            const faceVertices = face.map(vertexIndex => this.geometry.vertices[vertexIndex]);

            // Triangulate the face (assuming convex faces)
            for (let i = 1; i < faceVertices.length - 1; i++) {
                const v0 = faceVertices[0];
                const v1 = faceVertices[i];
                const v2 = faceVertices[i + 1];

                // Scale vertices
                const scaledV0 = v0.map(v => v * this.geometry.scaleFactor * this.options.size);
                const scaledV1 = v1.map(v => v * this.geometry.scaleFactor * this.options.size);
                const scaledV2 = v2.map(v => v * this.geometry.scaleFactor * this.options.size);

                // Add vertices
                vertices.push(...scaledV0, ...scaledV1, ...scaledV2);

                // Calculate normal
                const vec1 = new THREE.Vector3().subVectors(
                    new THREE.Vector3(...scaledV1),
                    new THREE.Vector3(...scaledV0)
                );
                const vec2 = new THREE.Vector3().subVectors(
                    new THREE.Vector3(...scaledV2),
                    new THREE.Vector3(...scaledV0)
                );
                const normal = new THREE.Vector3().crossVectors(vec1, vec2).normalize();

                // Add normals (same for all 3 vertices of triangle)
                normals.push(normal.x, normal.y, normal.z);
                normals.push(normal.x, normal.y, normal.z);
                normals.push(normal.x, normal.y, normal.z);

                // Add UVs for texture mapping
                uvs.push(0, 0, 1, 0, 0.5, 1);

                // Add indices
                const baseIndex = indices.length;
                indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
            }
        }

        // Create BufferGeometry
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);

        return geometry;
    }

    /**
     * Creates materials for each face with appropriate textures
     * @returns Array of materials for each face
     */
    private createFaceMaterials(): THREE.Material[] {
        const materials: THREE.Material[] = [];

        for (let i = 0; i < this.geometry.faceTexts.length; i++) {
            const faceText = this.geometry.faceTexts[i];
            const cacheKey = `${faceText}_${this.options.fontColor}_${this.options.backColor}`;

            let texture = this.textureCache.get(cacheKey);
            if (!texture) {
                texture = this.options.customTextTextureFunction(
                    faceText,
                    this.options.fontColor.toString(),
                    this.options.backColor.toString()
                );
                this.textureCache.set(cacheKey, texture);
            }

            const material = new THREE.MeshLambertMaterial({
                map: texture,
                transparent: true
            });
            materials.push(material);
        }

        return materials;
    }

    /**
     * Creates the Cannon.js physics body
     * @returns The created physics body
     */
    private createBody(): CANNON.Body {
        let shape: CANNON.Shape;

        // Create appropriate physics shape based on dice geometry
        if (this.geometry.values === 6) {
            // D6 - Simple box shape for cube
            const halfExtents = new CANNON.Vec3(
                this.geometry.scaleFactor * this.options.size * 0.5,
                this.geometry.scaleFactor * this.options.size * 0.5,
                this.geometry.scaleFactor * this.options.size * 0.5
            );
            shape = new CANNON.Box(halfExtents);
        } else {
            // Other dice types (D4, D8, D10, D12, D20) - Use ConvexPolyhedron
            shape = this.createConvexPolyhedronShape();
        }

        // Create body with the shape
        const body = new CANNON.Body({
            mass: this.geometry.mass,
            shape: shape,
            material: DiceManager.getMaterials()?.dice
        });

        // Add damping to help dice come to rest naturally
        body.linearDamping = 0.1;    // Restored normal damping
        body.angularDamping = 0.1;   // Restored normal damping

        console.log('🎲 Created physics body:', {
            mass: this.geometry.mass,
            shape: this.geometry.values === 6 ? 'Box' : 'ConvexPolyhedron',
            diceType: `D${this.geometry.values}`,
            material: !!DiceManager.getMaterials()?.dice
        });

        return body;
    }

    /**
     * Creates a ConvexPolyhedron shape from dice geometry
     * Used for complex dice shapes like D4, D8, D10, D12, D20
     * @returns ConvexPolyhedron shape for physics simulation
     */
    private createConvexPolyhedronShape(): CANNON.ConvexPolyhedron {
        // Scale vertices to match dice size
        const scaledVertices = this.geometry.vertices.map(vertex =>
            vertex.map(coord => coord * this.geometry.scaleFactor * this.options.size)
        );

        // Convert to Cannon.js Vec3 format
        const cannonVertices = scaledVertices.map(vertex =>
            new CANNON.Vec3(vertex[0], vertex[1], vertex[2])
        );

        // Convert faces to the format expected by ConvexPolyhedron
        // Cannon.js expects faces as arrays of vertex indices
        const cannonFaces = this.geometry.faces.map(face => [...face]);

        try {
            // Create ConvexPolyhedron shape
            const shape = new CANNON.ConvexPolyhedron({
                vertices: cannonVertices,
                faces: cannonFaces
            });

            return shape;
        } catch (error) {
            console.error(`Failed to create ConvexPolyhedron for D${this.geometry.values}:`, error);

            // Fallback to a sphere if ConvexPolyhedron creation fails
            console.warn(`Falling back to sphere shape for D${this.geometry.values}`);
            const radius = this.geometry.scaleFactor * this.options.size * 0.5;
            return new CANNON.Sphere(radius) as any; // Type assertion to match return type
        }
    }

    /**
     * Creates a texture with text for dice faces
     * @param text - Text to render on the texture
     * @param color - Color of the text
     * @param backColor - Background color of the texture
     * @returns The created texture
     */
    static createTextTexture(text: string, color: string, backColor: string): THREE.Texture {
        // Check if we're in a browser environment
        if (typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
            // Create a simple colored texture for testing/server environments
            const size = 256;
            // Mock canvas for server environments - not actually used

            // Return a basic texture that Three.js can handle
            const texture = new THREE.DataTexture(
                new Uint8Array(size * size * 4).fill(255), // White texture
                size,
                size,
                THREE.RGBAFormat
            );
            texture.needsUpdate = true;
            return texture;
        }

        const size = PhysicsUtils.calculateTextureSize(256);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext('2d')!;

        // Set background
        context.fillStyle = backColor;
        context.fillRect(0, 0, size, size);

        // Set text properties
        context.fillStyle = color;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = `bold ${size * 0.6}px Arial`;

        // Draw text
        context.fillText(text, size / 2, size / 2);

        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.generateMipmaps = true;

        return texture;
    }

    /**
     * Gets the current position of the dice
     * @returns Three.js Vector3 of current position
     */
    public getPosition(): THREE.Vector3 {
        return PhysicsUtils.cannonVectorToThree(this.body.position);
    }

    /**
     * Sets the position of the dice
     * @param position - New position as Three.js Vector3
     */
    public setPosition(position: THREE.Vector3): void {
        this.body.position.copy(PhysicsUtils.threeVectorToCannon(position));
        this.object.position.copy(position);

        // Wake up the physics body to ensure it responds to physics
        this.body.wakeUp();
    }

    /**
     * Gets the current rotation of the dice
     * @returns Three.js Quaternion of current rotation
     */
    public getRotation(): THREE.Quaternion {
        return PhysicsUtils.cannonQuaternionToThree(this.body.quaternion);
    }

    /**
     * Sets the rotation of the dice
     * @param quaternion - New rotation as Three.js Quaternion
     */
    public setRotation(quaternion: THREE.Quaternion): void {
        this.body.quaternion.copy(PhysicsUtils.threeQuaternionToCannon(quaternion));
        this.object.quaternion.copy(quaternion);

        // Wake up the physics body to ensure it responds to physics
        this.body.wakeUp();
    }

    /**
     * Gets the current physics vectors (position, rotation, velocities)
     * @returns DiceVectors object with current state
     */
    public getCurrentVectors(): DiceVectors {
        return {
            position: this.body.position.clone(),
            quaternion: this.body.quaternion.clone(),
            velocity: this.body.velocity.clone(),
            angularVelocity: this.body.angularVelocity.clone()
        };
    }

    /**
     * Sets the physics vectors (position, rotation, velocities)
     * @param vectors - DiceVectors object with new state
     */
    public setVectors(vectors: DiceVectors): void {
        this.body.position.copy(vectors.position);
        this.body.quaternion.copy(vectors.quaternion);
        this.body.velocity.copy(vectors.velocity);
        this.body.angularVelocity.copy(vectors.angularVelocity);

        // Update Three.js object
        this.object.position.copy(PhysicsUtils.cannonVectorToThree(vectors.position));
        this.object.quaternion.copy(PhysicsUtils.cannonQuaternionToThree(vectors.quaternion));

        // Wake up the physics body to ensure it responds to physics
        this.body.wakeUp();
    }

    /**
     * Checks if the dice has finished moving (is stable)
     * @returns True if the dice is stable
     */
    public isFinished(): boolean {
        return DiceManager.isDiceStable(this);
    }

    /**
     * Updates the Three.js object position and rotation from physics body
     * Should be called each frame during simulation
     */
    public updateMesh(): void {
        this.object.position.copy(PhysicsUtils.cannonVectorToThree(this.body.position));
        this.object.quaternion.copy(PhysicsUtils.cannonQuaternionToThree(this.body.quaternion));
    }

    /**
     * Gets the current upper-facing value of the dice
     * @returns The value currently facing up
     */
    public getUpperValue(): number {
        return this.calculateUpperValue();
    }

    /**
     * Gets the number of sides/values for this dice type
     * @returns The number of possible values (e.g., 6 for a d6)
     */
    public getValueCount(): number {
        return this.geometry.values;
    }

    /**
     * Abstract method to calculate which face is currently facing up
     * Must be implemented by subclasses based on their geometry
     * @returns The value of the face currently facing up
     */
    protected abstract calculateUpperValue(): number;

    /**
     * Abstract method to shift the dice to show a specific value facing up
     * Must be implemented by subclasses based on their geometry
     * @param targetValue - The value that should be facing up
     */
    public abstract shiftUpperValue(targetValue: number): void;

    /**
     * Disposes of the dice object and cleans up resources
     */
    public dispose(): void {
        // Remove from physics world
        if (DiceManager.getWorld()) {
            DiceManager.removeBody(this.body);
        }

        // Dispose of geometry
        this.object.geometry.dispose();

        // Dispose of materials and textures
        if (Array.isArray(this.object.material)) {
            this.object.material.forEach(material => {
                if ((material as any).map) {
                    (material as any).map.dispose();
                }
                material.dispose();
            });
        } else {
            if ((this.object.material as any).map) {
                (this.object.material as any).map.dispose();
            }
            this.object.material.dispose();
        }

        // Clear texture cache
        this.textureCache.forEach(texture => texture.dispose());
        this.textureCache.clear();

        // Clear references
        this.object.userData.body = null;
        (this.body as any).userData = null;
    }
} 