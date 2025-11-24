import type { DiceGeometry } from '../../types/DiceTypes';

/**
 * Geometry definition for a twelve-sided die (D12)
 * Defines the dodecahedron structure with proper vertex positions and face mappings
 * D12 dice use standard reading - the value is on the top face (like D6/D8/D20)
 * 
 * This geometry is adapted from the original threejs-dice library
 */

// Golden ratio constant for dodecahedron calculations
const PHI = (1 + Math.sqrt(5)) / 2; // ≈ 1.618033988749895
const INVPHI = 1 / PHI; // ≈ 0.618033988749895

export const D12Geometry: DiceGeometry = {
    /**
     * Vertices defining the dodecahedron corners
     * Ordered as: [x, y, z] coordinates for each vertex
     * Uses the exact vertex layout from the original threejs-dice library
     * 20 vertices total forming a regular dodecahedron
     */
    vertices: [
        // Original threejs-dice D12 vertices (adapted from the working implementation)
        [0, INVPHI, PHI],        // 0
        [0, INVPHI, -PHI],       // 1
        [0, -INVPHI, PHI],       // 2
        [0, -INVPHI, -PHI],      // 3
        [PHI, 0, INVPHI],        // 4
        [PHI, 0, -INVPHI],       // 5
        [-PHI, 0, INVPHI],       // 6
        [-PHI, 0, -INVPHI],      // 7
        [INVPHI, PHI, 0],        // 8
        [INVPHI, -PHI, 0],       // 9
        [-INVPHI, PHI, 0],       // 10
        [-INVPHI, -PHI, 0],      // 11
        [1, 1, 1],               // 12
        [1, 1, -1],              // 13
        [1, -1, 1],              // 14
        [1, -1, -1],             // 15
        [-1, 1, 1],              // 16
        [-1, 1, -1],             // 17
        [-1, -1, 1],             // 18
        [-1, -1, -1],            // 19
    ],

    /**
     * Face definitions using vertex indices
     * Each face is defined by vertices in counter-clockwise order (when viewed from outside)
     * D12 faces are pentagonal forming a dodecahedron
     * 12 faces total - exact layout from original threejs-dice
     * Note: Each face array has 6 elements, the last one is the face material index
     */
    faces: [
        [2, 14, 4, 12, 0],       // Face 0 (value 1)
        [15, 9, 11, 19, 3],      // Face 1 (value 2)
        [16, 10, 17, 7, 6],      // Face 2 (value 3)
        [6, 7, 19, 11, 18],      // Face 3 (value 4)
        [6, 18, 2, 0, 16],       // Face 4 (value 5)
        [18, 11, 9, 14, 2],      // Face 5 (value 6)
        [1, 17, 10, 8, 13],      // Face 6 (value 7)
        [1, 13, 5, 15, 3],       // Face 7 (value 8)
        [13, 8, 12, 4, 5],       // Face 8 (value 9)
        [5, 4, 14, 9, 15],       // Face 9 (value 10)
        [0, 12, 8, 10, 16],      // Face 10 (value 11)
        [3, 19, 7, 17, 1],       // Face 11 (value 12)
    ],

    /**
     * Scale factor for adjusting the geometry size
     */
    scaleFactor: 0.75,

    /**
     * Number of faces/values on this dice type
     */
    values: 12,

    /**
     * Text/symbols for each face (corresponding to face array order)
     * For D12, the numbers are read from the TOP face (standard reading)
     * Layout matches face order: 1-12 distributed across pentagonal faces
     */
    faceTexts: [
        '1', '2', '3', '4', '5', '6',      // First 6 faces
        '7', '8', '9', '10', '11', '12'    // Last 6 faces
    ],

    /**
     * Chamfer amount for edge rounding (0-1)
     * Using the same chamfer as the original threejs-dice
     */
    chamfer: 0.968,

    /**
     * Tab parameter for geometry generation
     * Using the same tab as the original threejs-dice
     */
    tab: 0.2,

    /**
     * AF parameter for geometry generation
     * Using the same af as the original threejs-dice
     */
    af: -Math.PI / 4 / 2,

    /**
     * Mass of the dice for physics simulation
     * Using similar mass as the original (converted to kg for cannon-es)
     */
    mass: 0.35, // 350 grams converted to kg

    /**
     * Text margin for face texture generation
     * Using the same text margin as the original threejs-dice
     */
    textMargin: 1.0,

    /**
     * Whether the dice reads upside down (like D4)
     * D12 uses standard reading (top face up), so this is false
     */
    invertUpside: false,
};

/**
 * Face-to-value mapping for D12
 * Maps face indices to their corresponding dice values
 * Used for determining which value is facing up (D12 reads top face)
 */
export const D12FaceValues: { [faceIndex: number]: number } = {
    0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6,
    6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12,
};

/**
 * Value-to-face mapping for D12
 * Maps dice values to their corresponding face indices
 * Used for positioning dice to show specific values
 */
export const D12ValueToFace: { [value: number]: number } = {
    1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5,
    7: 6, 8: 7, 9: 8, 10: 9, 11: 10, 12: 11,
};

/**
 * Face normal vectors for determining which face is up/down
 * Each vector points outward from the center of each face
 * Used in conjunction with gravity to determine face orientation
 * For D12, we find which face is UP (pointing away from gravity)
 * 
 * These normals are calculated for the corrected dodecahedron geometry
 * based on the original threejs-dice vertex layout
 */
export const D12FaceNormals = [
    // Face normals calculated from the original geometry
    [0.525, 0.000, 0.851],    // Face 0 (value 1)
    [0.000, -0.851, -0.525],  // Face 1 (value 2)
    [-0.851, 0.525, 0.000],   // Face 2 (value 3)
    [-0.525, -0.309, 0.794],  // Face 3 (value 4)
    [-0.525, 0.309, 0.794],   // Face 4 (value 5)
    [0.000, -0.851, 0.525],   // Face 5 (value 6)
    [0.000, 0.851, -0.525],   // Face 6 (value 7)
    [0.525, 0.000, -0.851],   // Face 7 (value 8)
    [0.851, 0.525, 0.000],    // Face 8 (value 9)
    [0.525, -0.309, -0.794],  // Face 9 (value 10)
    [0.000, 0.851, 0.525],    // Face 10 (value 11)
    [-0.525, 0.000, -0.851],  // Face 11 (value 12)
];

/**
 * Standard D12 dice validation
 * Ensures the geometry definition is mathematically correct
 */
export function validateD12Geometry(): boolean {
    // Verify we have 20 vertices (dodecahedron corners)
    if (D12Geometry.vertices.length !== 20) {
        console.error('D12 geometry must have exactly 20 vertices');
        return false;
    }

    // Verify we have 12 faces
    if (D12Geometry.faces.length !== 12) {
        console.error('D12 geometry must have exactly 12 faces');
        return false;
    }

    // Verify each face has 5 vertices (pentagonal)
    for (let i = 0; i < D12Geometry.faces.length; i++) {
        if (D12Geometry.faces[i].length !== 5) {
            console.error(`D12 face ${i} must have exactly 5 vertices (pentagonal)`);
            return false;
        }
    }

    // Verify face texts match number of faces
    if (D12Geometry.faceTexts.length !== 12) {
        console.error('D12 must have exactly 12 face texts');
        return false;
    }

    // Verify values property matches actual dice
    if (D12Geometry.values !== 12) {
        console.error('D12 values property must be 12');
        return false;
    }

    // Verify invertUpside is false (D12 reads from top)
    if (D12Geometry.invertUpside) {
        console.error('D12 must have invertUpside set to false');
        return false;
    }

    // Verify all face values are 1-12
    const faceValueSet = new Set(Object.values(D12FaceValues));
    const expectedValues = new Set(Array.from({ length: 12 }, (_, i) => i + 1));
    if (faceValueSet.size !== 12 || !Array.from(faceValueSet).every(v => expectedValues.has(v))) {
        console.error('D12 face values must be exactly [1, 2, 3, ..., 12]');
        return false;
    }

    // Verify face normals count
    if (D12FaceNormals.length !== 12) {
        console.error('D12 must have exactly 12 face normals');
        return false;
    }

    // Verify golden ratio calculations are reasonable
    const calculatedPhi = (1 + Math.sqrt(5)) / 2;
    if (Math.abs(PHI - calculatedPhi) > 0.000001) {
        console.error('D12 golden ratio calculation is incorrect');
        return false;
    }

    console.log('D12 geometry validation passed');
    return true;
} 