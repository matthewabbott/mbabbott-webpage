import type { DiceGeometry } from '../../types/DiceTypes';

/**
 * Geometry definition for a ten-sided die (D10)
 * Defines the pentagonal trapezohedron structure with proper vertex positions and face mappings
 * D10 dice use standard reading - the value is on the top face (like D6/D8/D12/D20)
 * 
 * This geometry is adapted from the original threejs-dice library
 * D10 is NOT a regular polyhedron - it's a pentagonal trapezohedron (deltohedron)
 * with 10 kite-shaped faces and 2 pentagonal caps
 */

/**
 * Generate D10 vertices programmatically
 * Creates a pentagonal trapezohedron with alternating vertex heights
 */
function generateD10Vertices(): number[][] {
    const vertices: number[][] = [];

    // Generate 10 vertices in a circle with alternating Z heights
    // This creates the characteristic "barrel" shape of a D10
    for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 / 10) * i; // 36 degrees apart
        const x = Math.cos(angle);
        const y = Math.sin(angle);
        // Alternate between +0.105 and -0.105 for Z coordinate
        const z = 0.105 * (i % 2 ? 1 : -1);
        vertices.push([x, y, z]);
    }

    // Add top and bottom vertices
    vertices.push([0, 0, -1]); // Bottom vertex (index 10)
    vertices.push([0, 0, 1]);  // Top vertex (index 11)

    return vertices;
}

export const D10Geometry: DiceGeometry = {
    /**
     * Vertices defining the pentagonal trapezohedron corners
     * 12 vertices total: 10 around the circumference + 2 polar vertices
     * Generated programmatically to ensure perfect symmetry
     */
    vertices: generateD10Vertices(),

    /**
     * Face definitions using vertex indices
     * Each face is defined by vertices in counter-clockwise order (when viewed from outside)
     * D10 has 20 faces total:
     * - 10 kite-shaped faces (4 vertices each) - these are the numbered faces
     * - 10 triangular faces (3 vertices each) - these connect the structure
     * 
     * From original threejs-dice: the first 10 faces are the kite-shaped numbered faces,
     * the last 10 faces are triangular connector faces (marked with -1 material index)
     */
    faces: [
        // Kite-shaped faces (numbered 1-10) - these are the main dice faces
        [5, 7, 11, 0],   // Face 0 (value 1) - kite shape
        [4, 2, 10, 1],   // Face 1 (value 2) - kite shape  
        [1, 3, 11, 2],   // Face 2 (value 3) - kite shape
        [0, 8, 10, 3],   // Face 3 (value 4) - kite shape
        [7, 9, 11, 4],   // Face 4 (value 5) - kite shape
        [8, 6, 10, 5],   // Face 5 (value 6) - kite shape
        [9, 1, 11, 6],   // Face 6 (value 7) - kite shape
        [2, 0, 10, 7],   // Face 7 (value 8) - kite shape
        [3, 5, 11, 8],   // Face 8 (value 9) - kite shape
        [6, 4, 10, 9],   // Face 9 (value 10) - kite shape

        // Triangular connector faces (no numbers) - these complete the geometry
        [1, 0, 2],       // Face 10 - triangular connector
        [1, 2, 3],       // Face 11 - triangular connector
        [3, 2, 4],       // Face 12 - triangular connector
        [3, 4, 5],       // Face 13 - triangular connector
        [5, 4, 6],       // Face 14 - triangular connector
        [5, 6, 7],       // Face 15 - triangular connector
        [7, 6, 8],       // Face 16 - triangular connector
        [7, 8, 9],       // Face 17 - triangular connector
        [9, 8, 0],       // Face 18 - triangular connector
        [9, 0, 1],       // Face 19 - triangular connector
    ],

    /**
     * Scale factor for adjusting the geometry size
     * Using the same scale factor as the original threejs-dice
     */
    scaleFactor: 0.9,

    /**
     * Number of faces/values on this dice type
     */
    values: 10,

    /**
     * Text/symbols for each face (corresponding to face array order)
     * For D10, only the first 10 faces (kite-shaped) have numbers
     * The triangular faces are structural and don't have numbers
     */
    faceTexts: [
        '1', '2', '3', '4', '5',      // First 5 kite faces
        '6', '7', '8', '9', '10',     // Last 5 kite faces
        '', '', '', '', '',           // Triangular faces (no text)
        '', '', '', '', ''            // Triangular faces (no text)
    ],

    /**
     * Chamfer amount for edge rounding (0-1)
     * Using the same chamfer as the original threejs-dice
     */
    chamfer: 0.945,

    /**
     * Tab parameter for geometry generation
     * Using the same tab as the original threejs-dice
     */
    tab: 0,

    /**
     * AF parameter for geometry generation
     * Using the same af as the original threejs-dice
     */
    af: Math.PI * 6 / 5,

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
     * D10 uses standard reading (top face up), so this is false
     */
    invertUpside: false,
};

/**
 * Face-to-value mapping for D10
 * Maps face indices to their corresponding dice values
 * Only the first 10 faces (kite-shaped) have values, triangular faces return 0
 */
export const D10FaceValues: { [faceIndex: number]: number } = {
    0: 1, 1: 2, 2: 3, 3: 4, 4: 5,
    5: 6, 6: 7, 7: 8, 8: 9, 9: 10,
    // Triangular faces don't have values
    10: 0, 11: 0, 12: 0, 13: 0, 14: 0,
    15: 0, 16: 0, 17: 0, 18: 0, 19: 0,
};

/**
 * Value-to-face mapping for D10
 * Maps dice values to their corresponding face indices
 * Used for positioning dice to show specific values
 */
export const D10ValueToFace: { [value: number]: number } = {
    1: 0, 2: 1, 3: 2, 4: 3, 5: 4,
    6: 5, 7: 6, 8: 7, 9: 8, 10: 9,
};

/**
 * Face normal vectors for determining which face is up/down
 * Each vector points outward from the center of each face
 * Used in conjunction with gravity to determine face orientation
 * For D10, we find which kite-shaped face is UP (pointing away from gravity)
 * 
 * Only the first 10 faces (kite-shaped) are used for value determination
 * The triangular faces are ignored for dice reading
 */
export const D10FaceNormals = [
    // Kite-shaped face normals (calculated for the pentagonal trapezohedron)
    [0.688, 0.500, 0.526],    // Face 0 (value 1)
    [-0.162, -0.500, -0.851], // Face 1 (value 2)
    [-0.526, 0.851, 0.000],   // Face 2 (value 3)
    [-0.688, -0.500, -0.526], // Face 3 (value 4)
    [0.526, 0.851, 0.000],    // Face 4 (value 5)
    [-0.688, 0.500, -0.526],  // Face 5 (value 6)
    [0.162, 0.500, 0.851],    // Face 6 (value 7)
    [0.162, -0.500, -0.851],  // Face 7 (value 8)
    [0.688, -0.500, 0.526],   // Face 8 (value 9)
    [-0.162, 0.500, -0.851],  // Face 9 (value 10)

    // Triangular face normals (not used for value determination)
    [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],
    [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0],
];

/**
 * Standard D10 dice validation
 * Ensures the geometry definition is mathematically correct
 */
export function validateD10Geometry(): boolean {
    // Verify we have 12 vertices (10 circumference + 2 polar)
    if (D10Geometry.vertices.length !== 12) {
        console.error('D10 geometry must have exactly 12 vertices');
        return false;
    }

    // Verify we have 20 faces (10 kite + 10 triangular)
    if (D10Geometry.faces.length !== 20) {
        console.error('D10 geometry must have exactly 20 faces');
        return false;
    }

    // Verify first 10 faces are kite-shaped (4 vertices each)
    for (let i = 0; i < 10; i++) {
        if (D10Geometry.faces[i].length !== 4) {
            console.error(`D10 kite face ${i} must have exactly 4 vertices`);
            return false;
        }
    }

    // Verify last 10 faces are triangular (3 vertices each)
    for (let i = 10; i < 20; i++) {
        if (D10Geometry.faces[i].length !== 3) {
            console.error(`D10 triangular face ${i} must have exactly 3 vertices`);
            return false;
        }
    }

    // Verify face texts match number of faces
    if (D10Geometry.faceTexts.length !== 20) {
        console.error('D10 must have exactly 20 face texts');
        return false;
    }

    // Verify values property matches actual dice
    if (D10Geometry.values !== 10) {
        console.error('D10 values property must be 10');
        return false;
    }

    // Verify invertUpside is false (D10 reads from top)
    if (D10Geometry.invertUpside) {
        console.error('D10 must have invertUpside set to false');
        return false;
    }

    // Verify kite face values are 1-10
    const kiteValues = Object.values(D10FaceValues).filter(v => v > 0);
    const expectedValues = new Set(Array.from({ length: 10 }, (_, i) => i + 1));
    if (kiteValues.length !== 10 || !kiteValues.every(v => expectedValues.has(v))) {
        console.error('D10 kite face values must be exactly [1, 2, 3, ..., 10]');
        return false;
    }

    // Verify face normals count (only first 10 are meaningful)
    if (D10FaceNormals.length !== 20) {
        console.error('D10 must have exactly 20 face normals');
        return false;
    }

    // Verify vertices are generated correctly (circumference vertices should be unit distance from origin in XY plane)
    for (let i = 0; i < 10; i++) {
        const vertex = D10Geometry.vertices[i];
        const xyDistance = Math.sqrt(vertex[0] * vertex[0] + vertex[1] * vertex[1]);
        if (Math.abs(xyDistance - 1.0) > 0.000001) {
            console.error(`D10 circumference vertex ${i} should be at unit distance from origin in XY plane`);
            return false;
        }
    }

    console.log('D10 geometry validation passed');
    return true;
} 