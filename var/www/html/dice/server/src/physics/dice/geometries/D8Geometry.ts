import type { DiceGeometry } from '../../types/DiceTypes';

/**
 * Geometry definition for an eight-sided die (D8)
 * Defines the octahedron structure with proper vertex positions and face mappings
 * D8 dice use standard reading - the value is on the top face (unlike D4)
 */
export const D8Geometry: DiceGeometry = {
    /**
     * Vertices defining the octahedron corners
     * Ordered as: [x, y, z] coordinates for each vertex
     * Creates a unit octahedron (dual pyramid structure)
     */
    vertices: [
        // Top vertex (positive Y)
        [0, 1, 0],         // 0: top vertex

        // Middle ring vertices (on XZ plane)
        [1, 0, 0],         // 1: positive X
        [0, 0, 1],         // 2: positive Z
        [-1, 0, 0],        // 3: negative X
        [0, 0, -1],        // 4: negative Z

        // Bottom vertex (negative Y)
        [0, -1, 0],        // 5: bottom vertex
    ],

    /**
     * Face definitions using vertex indices
     * Each face is defined by vertices in counter-clockwise order (when viewed from outside)
     * D8 faces are triangular forming an octahedron (dual pyramid)
     * Fixed ordering to ensure outward-pointing normals for cannon-es
     */
    faces: [
        // Upper pyramid faces (4 triangular faces) - CCW when viewed from outside
        [0, 2, 1], // Face 0: top-front-right (value 1) - fixed winding
        [0, 3, 2], // Face 1: top-back-right (value 2) - fixed winding  
        [0, 4, 3], // Face 2: top-back-left (value 3) - fixed winding
        [0, 1, 4], // Face 3: top-front-left (value 4) - fixed winding

        // Lower pyramid faces (4 triangular faces) - CCW when viewed from outside
        [5, 1, 2], // Face 4: bottom-front-right (value 5) - fixed winding
        [5, 2, 3], // Face 5: bottom-back-right (value 6) - fixed winding
        [5, 3, 4], // Face 6: bottom-back-left (value 7) - fixed winding
        [5, 4, 1], // Face 7: bottom-front-left (value 8) - fixed winding
    ],

    /**
     * Scale factor for adjusting the geometry size
     * Base unit octahedron will be multiplied by this factor
     */
    scaleFactor: 1.0,

    /**
     * Number of faces/values on this dice type
     */
    values: 8,

    /**
     * Text/symbols for each face (corresponding to face array order)
     * For D8, the numbers are read from the TOP face (standard reading)
     * Layout matches face order: 1-4 on upper pyramid, 5-8 on lower pyramid
     */
    faceTexts: ['1', '2', '3', '4', '5', '6', '7', '8'],

    /**
     * Chamfer amount for edge rounding (0-1)
     * D8 has moderate chamfering for good rolling characteristics
     */
    chamfer: 0.08,

    /**
     * Tab parameter for geometry generation
     * Controls the tab size for face texture mapping
     */
    tab: 0.1,

    /**
     * AF parameter for geometry generation
     * Advanced face parameter for texture calculations (60 degrees for triangular faces)
     */
    af: Math.PI / 3,

    /**
     * Mass of the dice for physics simulation
     * D8 is heavier than D4 but lighter than D6 due to intermediate size
     */
    mass: 0.003, // 3 grams

    /**
     * Text margin for face texture generation
     * Percentage of face size to use as margin around text
     */
    textMargin: 0.12,

    /**
     * Whether the dice reads upside down (like D4)
     * D8 uses standard reading (top face up), so this is false
     */
    invertUpside: false,
};

/**
 * Face-to-value mapping for D8
 * Maps face indices to their corresponding dice values
 * Used for determining which value is facing up (D8 reads top face)
 */
export const D8FaceValues: { [faceIndex: number]: number } = {
    0: 1, // upper front-right face
    1: 2, // upper back-right face
    2: 3, // upper back-left face
    3: 4, // upper front-left face
    4: 5, // lower front-right face
    5: 6, // lower back-right face
    6: 7, // lower back-left face
    7: 8, // lower front-left face
};

/**
 * Value-to-face mapping for D8
 * Maps dice values to their corresponding face indices
 * Used for positioning dice to show specific values
 */
export const D8ValueToFace: { [value: number]: number } = {
    1: 0, // value 1 -> upper front-right face
    2: 1, // value 2 -> upper back-right face
    3: 2, // value 3 -> upper back-left face
    4: 3, // value 4 -> upper front-left face
    5: 4, // value 5 -> lower front-right face
    6: 5, // value 6 -> lower back-right face
    7: 6, // value 7 -> lower back-left face
    8: 7, // value 8 -> lower front-left face
};

/**
 * Face normal vectors for determining which face is up/down
 * Each vector points outward from the center of each face
 * Used in conjunction with gravity to determine face orientation
 * For D8, we find which face is UP (pointing away from gravity)
 */
export const D8FaceNormals = [
    // Upper pyramid face normals (pointing up and outward)
    [0.577, 0.577, 0.577],   // Face 0: upper front-right normal
    [-0.577, 0.577, 0.577],  // Face 1: upper back-right normal
    [-0.577, 0.577, -0.577], // Face 2: upper back-left normal
    [0.577, 0.577, -0.577],  // Face 3: upper front-left normal

    // Lower pyramid face normals (pointing down and outward)
    [0.577, -0.577, 0.577],  // Face 4: lower front-right normal
    [-0.577, -0.577, 0.577], // Face 5: lower back-right normal
    [-0.577, -0.577, -0.577],// Face 6: lower back-left normal
    [0.577, -0.577, -0.577], // Face 7: lower front-left normal
];

/**
 * Standard D8 dice validation
 * Ensures the geometry definition is mathematically correct
 */
export function validateD8Geometry(): boolean {
    // Verify we have 6 vertices (octahedron corners)
    if (D8Geometry.vertices.length !== 6) {
        console.error('D8 geometry must have exactly 6 vertices');
        return false;
    }

    // Verify we have 8 faces
    if (D8Geometry.faces.length !== 8) {
        console.error('D8 geometry must have exactly 8 faces');
        return false;
    }

    // Verify each face has 3 vertices (triangular)
    for (let i = 0; i < D8Geometry.faces.length; i++) {
        if (D8Geometry.faces[i].length !== 3) {
            console.error(`D8 face ${i} must have exactly 3 vertices (triangular)`);
            return false;
        }
    }

    // Verify face texts match number of faces
    if (D8Geometry.faceTexts.length !== 8) {
        console.error('D8 must have exactly 8 face texts');
        return false;
    }

    // Verify values property matches actual dice
    if (D8Geometry.values !== 8) {
        console.error('D8 values property must be 8');
        return false;
    }

    // Verify invertUpside is false (D8 reads from top)
    if (D8Geometry.invertUpside) {
        console.error('D8 must have invertUpside set to false');
        return false;
    }

    // Verify all face values are 1-8
    const faceValueSet = new Set(Object.values(D8FaceValues));
    const expectedValues = new Set([1, 2, 3, 4, 5, 6, 7, 8]);
    if (faceValueSet.size !== 8 || ![...faceValueSet].every(v => expectedValues.has(v))) {
        console.error('D8 face values must be exactly [1, 2, 3, 4, 5, 6, 7, 8]');
        return false;
    }

    // Verify face normals count
    if (D8FaceNormals.length !== 8) {
        console.error('D8 must have exactly 8 face normals');
        return false;
    }

    console.log('D8 geometry validation passed');
    return true;
} 