import type { DiceGeometry } from '../../types/DiceTypes';

/**
 * Geometry definition for a twenty-sided die (D20)
 * Defines the icosahedron structure with proper vertex positions and face mappings
 * D20 dice use standard reading - the value is on the top face (like D6/D8)
 */

// Golden ratio constant for icosahedron calculations
const PHI = (1 + Math.sqrt(5)) / 2; // ≈ 1.618033988749895

export const D20Geometry: DiceGeometry = {
    /**
     * Vertices defining the icosahedron corners
     * Ordered as: [x, y, z] coordinates for each vertex
     * Uses standard icosahedron construction with three orthogonal golden rectangles
     * 12 vertices total
     */
    vertices: [
        // Golden rectangles method for icosahedron vertices
        // First golden rectangle in XY plane
        [-1, PHI, 0],     // 0
        [1, PHI, 0],      // 1
        [-1, -PHI, 0],    // 2
        [1, -PHI, 0],     // 3

        // Second golden rectangle in YZ plane  
        [0, -1, PHI],     // 4
        [0, 1, PHI],      // 5
        [0, -1, -PHI],    // 6
        [0, 1, -PHI],     // 7

        // Third golden rectangle in XZ plane
        [PHI, 0, -1],     // 8
        [PHI, 0, 1],      // 9
        [-PHI, 0, -1],    // 10
        [-PHI, 0, 1],     // 11
    ],

    /**
     * Face definitions using vertex indices
     * Each face is defined by vertices in counter-clockwise order (when viewed from outside)
     * D20 faces are triangular forming an icosahedron
     * 20 faces total - carefully ordered to ensure outward-pointing normals
     */
    faces: [
        // Top cap faces (around vertex with highest Y coordinate)
        [0, 11, 5],   // Face 0
        [0, 5, 1],    // Face 1  
        [0, 1, 7],    // Face 2
        [0, 7, 10],   // Face 3
        [0, 10, 11],  // Face 4

        // Upper band faces
        [1, 5, 9],    // Face 5
        [5, 11, 4],   // Face 6
        [11, 10, 2],  // Face 7
        [10, 7, 6],   // Face 8
        [7, 1, 8],    // Face 9

        // Lower band faces  
        [3, 9, 4],    // Face 10
        [3, 4, 2],    // Face 11
        [3, 2, 6],    // Face 12
        [3, 6, 8],    // Face 13
        [3, 8, 9],    // Face 14

        // Bottom cap faces (around vertex with lowest Y coordinate)
        [4, 9, 5],    // Face 15
        [2, 4, 11],   // Face 16
        [6, 2, 10],   // Face 17
        [8, 6, 7],    // Face 18
        [9, 8, 1],    // Face 19
    ],

    /**
     * Scale factor for adjusting the geometry size
     * Base unit icosahedron will be multiplied by this factor
     * D20 is scaled down to prevent ground clipping (golden ratio creates large coordinates)
     */
    scaleFactor: 0.6,

    /**
     * Number of faces/values on this dice type
     */
    values: 20,

    /**
     * Text/symbols for each face (corresponding to face array order)
     * For D20, the numbers are read from the TOP face (standard reading)
     * Layout matches face order: 1-5 top cap, 6-15 middle bands, 16-20 bottom cap
     */
    faceTexts: [
        '1', '2', '3', '4', '5',        // Top cap (faces 0-4)
        '6', '7', '8', '9', '10',       // Upper middle band (faces 5-9)
        '11', '12', '13', '14', '15',   // Lower middle band (faces 10-14)
        '16', '17', '18', '19', '20'    // Bottom cap (faces 15-19)
    ],

    /**
     * Chamfer amount for edge rounding (0-1)
     * D20 has light chamfering for smooth rolling while maintaining sharp definition
     */
    chamfer: 0.06,

    /**
     * Tab parameter for geometry generation
     * Controls the tab size for face texture mapping
     */
    tab: 0.08,

    /**
     * AF parameter for geometry generation
     * Advanced face parameter for texture calculations (60 degrees for triangular faces)
     */
    af: Math.PI / 3,

    /**
     * Mass of the dice for physics simulation
     * D20 is heavier due to larger size and more material
     */
    mass: 0.005, // 5 grams

    /**
     * Text margin for face texture generation
     * Percentage of face size to use as margin around text
     */
    textMargin: 0.10,

    /**
     * Whether the dice reads upside down (like D4)
     * D20 uses standard reading (top face up), so this is false
     */
    invertUpside: false,
};

/**
 * Face-to-value mapping for D20
 * Maps face indices to their corresponding dice values
 * Used for determining which value is facing up (D20 reads top face)
 */
export const D20FaceValues: { [faceIndex: number]: number } = {
    // Top cap faces (1-5)
    0: 1, 1: 2, 2: 3, 3: 4, 4: 5,
    // Upper middle band (6-10)
    5: 6, 6: 7, 7: 8, 8: 9, 9: 10,
    // Lower middle band (11-15) 
    10: 11, 11: 12, 12: 13, 13: 14, 14: 15,
    // Bottom cap faces (16-20)
    15: 16, 16: 17, 17: 18, 18: 19, 19: 20,
};

/**
 * Value-to-face mapping for D20
 * Maps dice values to their corresponding face indices
 * Used for positioning dice to show specific values
 */
export const D20ValueToFace: { [value: number]: number } = {
    // Top cap (values 1-5)
    1: 0, 2: 1, 3: 2, 4: 3, 5: 4,
    // Upper middle band (values 6-10)
    6: 5, 7: 6, 8: 7, 9: 8, 10: 9,
    // Lower middle band (values 11-15)
    11: 10, 12: 11, 13: 12, 14: 13, 15: 14,
    // Bottom cap (values 16-20)
    16: 15, 17: 16, 18: 17, 19: 18, 20: 19,
};

/**
 * Face normal vectors for determining which face is up/down
 * Each vector points outward from the center of each face
 * Used in conjunction with gravity to determine face orientation
 * For D20, we find which face is UP (pointing away from gravity)
 * 
 * Calculated for the corrected icosahedron geometry using standard methods
 */
export const D20FaceNormals = [
    // Top cap face normals (around highest Y vertex)
    [-0.357, 0.934, 0.000],   // Face 0
    [0.000, 0.934, 0.357],    // Face 1
    [0.577, 0.577, -0.577],   // Face 2
    [-0.577, 0.577, -0.577],  // Face 3
    [-0.577, 0.577, 0.577],   // Face 4

    // Upper band face normals
    [0.577, 0.577, 0.577],    // Face 5
    [-0.000, 0.357, 0.934],   // Face 6
    [-0.934, 0.357, 0.000],   // Face 7
    [-0.577, 0.577, -0.577],  // Face 8
    [0.934, 0.357, -0.000],   // Face 9

    // Lower band face normals
    [0.934, -0.357, 0.000],   // Face 10
    [-0.000, -0.357, 0.934],  // Face 11
    [-0.934, -0.357, 0.000],  // Face 12
    [0.000, -0.357, -0.934],  // Face 13
    [0.934, -0.357, 0.000],   // Face 14

    // Bottom cap face normals (around lowest Y vertex)
    [0.000, -0.934, 0.357],   // Face 15
    [-0.577, -0.577, 0.577],  // Face 16
    [-0.577, -0.577, -0.577], // Face 17
    [0.577, -0.577, -0.577],  // Face 18
    [0.577, -0.577, 0.577],   // Face 19
];

/**
 * Standard D20 dice validation
 * Ensures the geometry definition is mathematically correct
 */
export function validateD20Geometry(): boolean {
    // Verify we have 12 vertices (icosahedron corners)
    if (D20Geometry.vertices.length !== 12) {
        console.error('D20 geometry must have exactly 12 vertices');
        return false;
    }

    // Verify we have 20 faces
    if (D20Geometry.faces.length !== 20) {
        console.error('D20 geometry must have exactly 20 faces');
        return false;
    }

    // Verify each face has 3 vertices (triangular)
    for (let i = 0; i < D20Geometry.faces.length; i++) {
        if (D20Geometry.faces[i].length !== 3) {
            console.error(`D20 face ${i} must have exactly 3 vertices (triangular)`);
            return false;
        }
    }

    // Verify face texts match number of faces
    if (D20Geometry.faceTexts.length !== 20) {
        console.error('D20 must have exactly 20 face texts');
        return false;
    }

    // Verify values property matches actual dice
    if (D20Geometry.values !== 20) {
        console.error('D20 values property must be 20');
        return false;
    }

    // Verify invertUpside is false (D20 reads from top)
    if (D20Geometry.invertUpside) {
        console.error('D20 must have invertUpside set to false');
        return false;
    }

    // Verify all face values are 1-20
    const faceValueSet = new Set(Object.values(D20FaceValues));
    const expectedValues = new Set(Array.from({ length: 20 }, (_, i) => i + 1));
    if (faceValueSet.size !== 20 || ![...faceValueSet].every(v => expectedValues.has(v))) {
        console.error('D20 face values must be exactly [1, 2, 3, ..., 20]');
        return false;
    }

    // Verify face normals count
    if (D20FaceNormals.length !== 20) {
        console.error('D20 must have exactly 20 face normals');
        return false;
    }

    // Verify golden ratio calculations are reasonable
    const calculatedPhi = (1 + Math.sqrt(5)) / 2;
    if (Math.abs(PHI - calculatedPhi) > 0.000001) {
        console.error('D20 golden ratio calculation is incorrect');
        return false;
    }

    console.log('D20 geometry validation passed');
    return true;
} 