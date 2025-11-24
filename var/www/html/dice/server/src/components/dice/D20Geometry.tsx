import React from 'react';
import * as THREE from 'three';
import { DiceGeometry, calculateNormals, generateBasicUVs } from './DiceGeometry';
import type { DiceGeometryComponent } from './DiceGeometry';

/**
 * D20 Icosahedron Geometry Component
 * Creates a custom D20 geometry that matches physics vertices exactly
 */
export const D20Geometry: DiceGeometryComponent = (props) => {
    const { size } = props;

    const geometry = React.useMemo(() => {
        const d20Geometry = new THREE.BufferGeometry();

        // Golden ratio for icosahedron calculations
        const PHI = (1 + Math.sqrt(5)) / 2; // ≈ 1.618033988749895

        // D20 icosahedron vertices (from corrected D20Geometry.ts)
        const icosahedronVertices = [
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
        ];

        // D20 faces (20 triangular faces) - corrected winding order (CCW from outside)
        const icosahedronFaces = [
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
        ];

        // Build vertices array for triangulated icosahedron
        const vertices = new Float32Array(icosahedronFaces.length * 9); // 20 faces * 3 vertices * 3 coords
        for (let faceIndex = 0; faceIndex < icosahedronFaces.length; faceIndex++) {
            const face = icosahedronFaces[faceIndex];
            for (let vertexIndex = 0; vertexIndex < 3; vertexIndex++) {
                const vertex = icosahedronVertices[face[vertexIndex]];
                const arrayIndex = faceIndex * 9 + vertexIndex * 3;
                // Apply size scaling and geometry scale factor (0.6 for D20)
                vertices[arrayIndex] = vertex[0] * size * 0.6;     // X
                vertices[arrayIndex + 1] = vertex[1] * size * 0.6; // Y
                vertices[arrayIndex + 2] = vertex[2] * size * 0.6; // Z
            }
        }

        const normals = calculateNormals(vertices);
        const uvs = generateBasicUVs(icosahedronFaces.length); // 20 triangular faces

        d20Geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        d20Geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        d20Geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        return d20Geometry;
    }, [size]);

    return <DiceGeometry {...props} geometry={geometry} />;
};

D20Geometry.diceType = 'd20'; 