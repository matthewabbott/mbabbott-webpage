import type { DiceGeometry } from '../../types/DiceTypes';

/**
 * Geometry definition for a four-sided die (D4)
 * Defines the tetrahedron structure with proper vertex positions and face mappings
 * D4 dice are read differently - the value is on the bottom/hidden face, not the top
 */
export const D4Geometry: DiceGeometry = {
    /**
     * Vertices defining the tetrahedron corners
     * Ordered as: [x, y, z] coordinates for each vertex
     * Creates a unit tetrahedron with base centered at origin
     */
    vertices: [
        // Base vertices (forming triangle on XZ plane)
        [-0.5, 0, -0.289], // 0: back vertex
        [0.5, 0, -0.289],  // 1: front-right vertex
        [0, 0, 0.577],     // 2: front-left vertex (apex of base triangle)

        // Top vertex (pyramid apex)
        [0, 0.816, 0]      // 3: top vertex (center above base)
    ],

    /**
     * Face definitions using vertex indices
     * Each face is defined by vertices in counter-clockwise order (when viewed from outside)
     * D4 faces are triangular, not quadrilateral like D6
     * Fixed ordering to ensure outward-pointing normals for cannon-es
     */
    faces: [
        // Face 0 (base): hidden face - this determines the dice value
        [0, 1, 2], // base triangle (bottom face) - CCW when viewed from below

        // Face 1: front face (visible when value 1 is up)
        [0, 3, 1], // front triangular face - CCW when viewed from front

        // Face 2: right face (visible when value 2 is up) 
        [1, 3, 2], // right triangular face - CCW when viewed from right

        // Face 3: left face (visible when value 3 is up)
        [2, 3, 0], // left triangular face - CCW when viewed from left
    ],

    /**
     * Scale factor for adjusting the geometry size
     * Base unit tetrahedron will be multiplied by this factor
     */
    scaleFactor: 1.0,

    /**
     * Number of faces/values on this dice type
     */
    values: 4,

    /**
     * Text/symbols for each face (corresponding to face array order)
     * For D4, the numbers are read from the BOTTOM face (inverted reading)
     * The visible faces show what the BOTTOM value is
     * Layout: 0-bottom(hidden), 1-front, 2-right, 3-left
     */
    faceTexts: ['4', '1', '2', '3'],

    /**
     * Chamfer amount for edge rounding (0-1)
     * D4 has sharper edges than D6 for better rolling characteristics
     */
    chamfer: 0.05,

    /**
     * Tab parameter for geometry generation
     * Controls the tab size for face texture mapping
     */
    tab: 0.1,

    /**
     * AF parameter for geometry generation
     * Advanced face parameter for texture calculations
     */
    af: Math.PI / 3, // 60 degrees for triangular faces

    /**
     * Mass of the dice for physics simulation
     * D4 is typically lighter than D6 due to smaller size
     */
    mass: 0.002, // 2 grams

    /**
     * Text margin for face texture generation
     * Percentage of face size to use as margin around text
     */
    textMargin: 0.15,

    /**
     * Whether the dice reads upside down (like D4)
     * D4 reads from the BOTTOM face, so this is true
     */
    invertUpside: true,
};

/**
 * Face-to-value mapping for D4
 * Maps face indices to their corresponding dice values
 * Used for determining which value is facing down (D4 reads bottom)
 */
export const D4FaceValues: { [faceIndex: number]: number } = {
    0: 4, // bottom face (hidden) - when this face is down, value is 4
    1: 1, // front face - when this face is up, bottom is 1
    2: 2, // right face - when this face is up, bottom is 2  
    3: 3, // left face - when this face is up, bottom is 3
};

/**
 * Value-to-face mapping for D4
 * Maps dice values to their corresponding face indices
 * Used for positioning dice to show specific values
 */
export const D4ValueToFace: { [value: number]: number } = {
    1: 1, // front face up = value 1
    2: 2, // right face up = value 2
    3: 3, // left face up = value 3
    4: 0, // bottom face down = value 4
};

/**
 * Face normal vectors for determining which face is up/down
 * Each vector points outward from the center of each face
 * Used in conjunction with gravity to determine face orientation
 * For D4, we need to find which face is DOWN (touching the ground)
 */
export const D4FaceNormals = [
    [0, -1, 0],      // bottom face normal (down) - when this points down, face is touching ground
    [0, 0.447, -0.894], // front face normal (up and forward)
    [0.774, 0.447, 0.447], // right face normal (up, right, and forward)
    [-0.774, 0.447, 0.447], // left face normal (up, left, and forward)
];

/**
 * Standard D4 dice validation
 * Ensures the geometry definition is mathematically correct
 */
export function validateD4Geometry(): boolean {
    // Verify we have 4 vertices (tetrahedron corners)
    if (D4Geometry.vertices.length !== 4) {
        console.error('D4 geometry must have exactly 4 vertices');
        return false;
    }

    // Verify we have 4 faces
    if (D4Geometry.faces.length !== 4) {
        console.error('D4 geometry must have exactly 4 faces');
        return false;
    }

    // Verify each face has 3 vertices (triangular)
    for (let i = 0; i < D4Geometry.faces.length; i++) {
        if (D4Geometry.faces[i].length !== 3) {
            console.error(`D4 face ${i} must have exactly 3 vertices (triangular)`);
            return false;
        }
    }

    // Verify face texts match number of faces
    if (D4Geometry.faceTexts.length !== 4) {
        console.error('D4 must have exactly 4 face texts');
        return false;
    }

    // Verify values property matches actual dice
    if (D4Geometry.values !== 4) {
        console.error('D4 values property must be 4');
        return false;
    }

    // Verify invertUpside is true (D4 reads from bottom)
    if (!D4Geometry.invertUpside) {
        console.error('D4 must have invertUpside set to true');
        return false;
    }

    // Verify all face values are 1-4
    const faceValueSet = new Set(Object.values(D4FaceValues));
    const expectedValues = new Set([1, 2, 3, 4]);
    if (faceValueSet.size !== 4 || ![...faceValueSet].every(v => expectedValues.has(v))) {
        console.error('D4 face values must be exactly [1, 2, 3, 4]');
        return false;
    }

    console.log('D4 geometry validation passed');
    return true;
} 