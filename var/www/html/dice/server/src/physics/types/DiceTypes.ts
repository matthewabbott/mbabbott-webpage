import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { DiceObject } from '../DiceObject';

/**
 * Configuration options for creating a dice instance
 */
export interface DiceOptions {
    /** Size of the dice in world units (default: 100) */
    size?: number;
    /** Color of the numbers/symbols on the dice faces (default: '#000000') */
    fontColor?: string | number;
    /** Background color of the dice (default: '#ffffff') */
    backColor?: string | number;
    /** Custom texture function for generating face textures */
    customTextTextureFunction?: (text: string, color: string, backColor: string) => THREE.Texture;
}

/**
 * Represents a dice and its target value for rolling simulation
 */
export interface DiceValuePair {
    /** The dice object to roll */
    dice: DiceObject;
    /** The target value the dice should land on (1-sided based on dice type) */
    value: number;
    /** Internal: Current physics vectors for state management */
    vectors?: DiceVectors;
    /** Internal: Counter for stability checking */
    stableCount?: number;
}

/**
 * Physics state vectors for preserving and restoring dice state
 */
export interface DiceVectors {
    /** World position of the dice */
    position: CANNON.Vec3;
    /** World rotation quaternion of the dice */
    quaternion: CANNON.Quaternion;
    /** Linear velocity vector */
    velocity: CANNON.Vec3;
    /** Angular velocity vector */
    angularVelocity: CANNON.Vec3;
}

/**
 * Extended CANNON.World type with additional properties for dice physics
 */
export type PhysicsWorld = CANNON.World;

/**
 * Material configuration for different surface types in dice physics
 */
export interface PhysicsMaterials {
    /** Material for dice bodies */
    dice: CANNON.Material;
    /** Material for floor/table surfaces */
    floor: CANNON.Material;
    /** Material for barrier walls */
    barrier: CANNON.Material;
}

/**
 * Contact material settings for realistic dice interactions
 */
export interface ContactMaterialConfig {
    /** Friction coefficient (0-1, where 0 is no friction) */
    friction: number;
    /** Restitution/bounciness (0-1, where 0 is no bounce, 1 is perfect bounce) */
    restitution: number;
}

/**
 * Geometry definition for a dice type
 */
export interface DiceGeometry {
    /** Array of vertex positions [x, y, z] */
    vertices: number[][];
    /** Array of face definitions, each face is an array of vertex indices */
    faces: number[][];
    /** Scale factor for the geometry */
    scaleFactor: number;
    /** Number of faces/values on this dice type */
    values: number;
    /** Text or symbols for each face */
    faceTexts: string[];
    /** Chamfer amount for edge rounding (0-1) */
    chamfer: number;
    /** Tab parameter for geometry generation */
    tab: number;
    /** AF parameter for geometry generation */
    af: number;
    /** Mass of the dice for physics simulation */
    mass: number;
    /** Text margin for face texture generation */
    textMargin?: number;
    /** Whether the dice reads upside down (like D4) */
    invertUpside?: boolean;
}

/**
 * Result of a dice roll operation
 */
export interface DiceRollResult {
    /** The dice that was rolled */
    dice: DiceObject;
    /** The final value that the dice landed on */
    value: number;
    /** Time taken for the dice to settle (in seconds) */
    settleDuration: number;
    /** Final position where the dice settled */
    finalPosition: THREE.Vector3;
    /** Final rotation where the dice settled */
    finalRotation: THREE.Quaternion;
}

/**
 * Configuration for dice physics simulation
 */
export interface PhysicsConfig {
    /** Gravity vector (default: [0, -9.82, 0]) */
    gravity: CANNON.Vec3;
    /** Number of solver iterations for physics accuracy */
    solverIterations: number;
    /** Whether physics bodies can go to sleep when stationary */
    allowSleep: boolean;
    /** Broadphase algorithm type */
    broadphase: 'naive' | 'sap' | 'grid';
    /** Time step for physics simulation (default: 1/60) */
    timeStep: number;
}

/**
 * Event data for dice physics events
 */
export interface DicePhysicsEvent {
    /** Type of event */
    type: 'roll-start' | 'roll-complete' | 'collision' | 'settled';
    /** The dice involved in the event */
    dice: DiceObject;
    /** Event-specific data */
    data?: {
        value?: number;
        position?: THREE.Vector3;
        rotation?: THREE.Quaternion;
        velocity?: THREE.Vector3;
        [key: string]: unknown;
    };
    /** Timestamp of the event */
    timestamp: number;
}

export interface DiceThrowEvent {
    type: 'throw';
    dice: DiceObject;
    data?: {
        targetValue?: number;
        force?: THREE.Vector3;
        torque?: THREE.Vector3;
        [key: string]: unknown;
    };
} 