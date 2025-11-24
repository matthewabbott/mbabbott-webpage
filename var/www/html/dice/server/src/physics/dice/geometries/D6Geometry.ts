import type { DiceGeometry } from '../../types/DiceTypes';

/**
 * Geometry definition for a standard six-sided die (D6)
 * Defines the cube structure with proper vertex positions and face mappings
 */
export const D6Geometry: DiceGeometry = {
    /**
     * Vertices defining the cube corners
     * Ordered as: [x, y, z] coordinates for each vertex
     * Creates a unit cube centered at origin
     */
    vertices: [
        // Bottom face vertices (y = -0.5)
        [-0.5, -0.5, -0.5], // 0: back-left-bottom
        [0.5, -0.5, -0.5], // 1: back-right-bottom  
        [0.5, -0.5, 0.5], // 2: front-right-bottom
        [-0.5, -0.5, 0.5], // 3: front-left-bottom

        // Top face vertices (y = 0.5)
        [-0.5, 0.5, -0.5], // 4: back-left-top
        [0.5, 0.5, -0.5], // 5: back-right-top
        [0.5, 0.5, 0.5], // 6: front-right-top
        [-0.5, 0.5, 0.5], // 7: front-left-top
    ],

    /**
     * Face definitions using vertex indices
     * Each face is defined by vertices in counter-clockwise order
     * Corresponds to standard dice face layout
     */
    faces: [
        // Face 1 (bottom): value 1 (single dot)
        [0, 1, 2, 3], // bottom face

        // Face 6 (top): value 6 (six dots)  
        [7, 6, 5, 4], // top face

        // Face 2 (front): value 2 (two dots)
        [3, 2, 6, 7], // front face

        // Face 5 (back): value 5 (five dots)
        [1, 0, 4, 5], // back face

        // Face 3 (right): value 3 (three dots)
        [2, 1, 5, 6], // right face

        // Face 4 (left): value 4 (four dots)
        [0, 3, 7, 4], // left face
    ],

    /**
     * Scale factor for adjusting the geometry size
     * Base unit cube will be multiplied by this factor
     */
    scaleFactor: 1.0,

    /**
     * Number of faces/values on this dice type
     */
    values: 6,

    /**
     * Text/symbols for each face (corresponding to face array order)
     * Standard dice numbering: opposite faces sum to 7
     * Layout: 1-bottom, 6-top, 2-front, 5-back, 3-right, 4-left
     */
    faceTexts: ['1', '6', '2', '5', '3', '4'],

    /**
     * Chamfer amount for edge rounding (0-1)
     * 0 = sharp edges, 1 = fully rounded
     */
    chamfer: 0.1,

    /**
     * Tab parameter for geometry generation
     * Controls the tab size for face texture mapping
     */
    tab: 0.2,

    /**
     * AF parameter for geometry generation
     * Advanced face parameter for texture calculations
     */
    af: Math.PI / 4,

    /**
     * Mass of the dice for physics simulation
     * Realistic mass for a standard plastic dice (in grams converted to kg)
     */
    mass: 0.004, // 4 grams

    /**
     * Text margin for face texture generation
     * Percentage of face size to use as margin around text
     */
    textMargin: 0.1,

    /**
     * Whether the dice reads upside down (like D4)
     * D6 reads normally, so this is false
     */
    invertUpside: false,
};

/**
 * Face-to-value mapping for D6
 * Maps face indices to their corresponding dice values
 * Used for determining which value is facing up
 */
export const D6FaceValues: { [faceIndex: number]: number } = {
    0: 1, // bottom face
    1: 6, // top face  
    2: 2, // front face
    3: 5, // back face
    4: 3, // right face
    5: 4, // left face
};

/**
 * Value-to-face mapping for D6
 * Maps dice values to their corresponding face indices
 * Used for positioning dice to show specific values
 */
export const D6ValueToFace: { [value: number]: number } = {
    1: 0, // bottom face
    2: 2, // front face
    3: 4, // right face
    4: 5, // left face
    5: 3, // back face
    6: 1, // top face
};

/**
 * Face normal vectors for determining which face is up
 * Each vector points outward from the center of each face
 * Used in conjunction with gravity to determine face orientation
 */
export const D6FaceNormals = [
    [0, -1, 0], // bottom face normal (down)
    [0, 1, 0], // top face normal (up)
    [0, 0, 1], // front face normal (forward)
    [0, 0, -1], // back face normal (backward)
    [1, 0, 0], // right face normal (right)
    [-1, 0, 0], // left face normal (left)
];

/**
 * Standard D6 dice validation
 * Ensures the geometry definition is mathematically correct
 */
export function validateD6Geometry(): boolean {
    // Verify we have 8 vertices (cube corners)
    if (D6Geometry.vertices.length !== 8) {
        console.error('D6 geometry must have exactly 8 vertices');
        return false;
    }

    // Verify we have 6 faces
    if (D6Geometry.faces.length !== 6) {
        console.error('D6 geometry must have exactly 6 faces');
        return false;
    }

    // Verify each face has 4 vertices (quadrilateral)
    for (let i = 0; i < D6Geometry.faces.length; i++) {
        if (D6Geometry.faces[i].length !== 4) {
            console.error(`D6 face ${i} must have exactly 4 vertices`);
            return false;
        }
    }

    // Verify face texts match number of faces
    if (D6Geometry.faceTexts.length !== 6) {
        console.error('D6 must have exactly 6 face texts');
        return false;
    }

    // Verify values property matches actual dice
    if (D6Geometry.values !== 6) {
        console.error('D6 values property must be 6');
        return false;
    }

    // Verify opposite faces sum to 7 (standard dice property)
    const bottomValue = parseInt(D6Geometry.faceTexts[0]);
    const topValue = parseInt(D6Geometry.faceTexts[1]);
    const frontValue = parseInt(D6Geometry.faceTexts[2]);
    const backValue = parseInt(D6Geometry.faceTexts[3]);
    const rightValue = parseInt(D6Geometry.faceTexts[4]);
    const leftValue = parseInt(D6Geometry.faceTexts[5]);

    if (bottomValue + topValue !== 7 ||
        frontValue + backValue !== 7 ||
        rightValue + leftValue !== 7) {
        console.error('D6 opposite faces must sum to 7');
        return false;
    }

    return true;
} 