import React from 'react';
import * as THREE from 'three';
import { DiceGeometry, calculateNormals, generateBasicUVs } from './DiceGeometry';
import type { DiceGeometryComponent } from './DiceGeometry';

/**
 * D12 Dodecahedron Geometry Component
 * Creates a custom D12 geometry that matches physics vertices exactly
 */
export const D12Geometry: DiceGeometryComponent = (props) => {
    const { size } = props;

    const geometry = React.useMemo(() => {
        const d12Geometry = new THREE.BufferGeometry();

        // Golden ratio for dodecahedron calculations
        const PHI = (1 + Math.sqrt(5)) / 2; // ≈ 1.618033988749895
        const INVPHI = 1 / PHI; // ≈ 0.618033988749895

        // D12 dodecahedron vertices (from corrected D12Geometry.ts - original threejs-dice layout)
        const dodecahedronVertices = [
            // Original threejs-dice D12 vertices
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
        ];

        // D12 faces (12 pentagonal faces) - exact layout from original threejs-dice
        const dodecahedronFaces = [
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
        ];

        // Triangulate pentagonal faces (each pentagon becomes 3 triangles)
        const triangulatedFaces = [];
        for (const face of dodecahedronFaces) {
            // Pentagon with vertices [v0, v1, v2, v3, v4]
            // Triangulate as: [v0,v1,v2], [v0,v2,v3], [v0,v3,v4]
            triangulatedFaces.push([face[0], face[1], face[2]]);
            triangulatedFaces.push([face[0], face[2], face[3]]);
            triangulatedFaces.push([face[0], face[3], face[4]]);
        }

        // Build vertices array for triangulated dodecahedron
        const vertices = new Float32Array(triangulatedFaces.length * 9); // 36 triangles * 3 vertices * 3 coords
        for (let faceIndex = 0; faceIndex < triangulatedFaces.length; faceIndex++) {
            const face = triangulatedFaces[faceIndex];
            for (let vertexIndex = 0; vertexIndex < 3; vertexIndex++) {
                const vertex = dodecahedronVertices[face[vertexIndex]];
                const arrayIndex = faceIndex * 9 + vertexIndex * 3;
                // Apply size scaling and geometry scale factor (0.75 for D12 - smaller than original 0.9)
                vertices[arrayIndex] = vertex[0] * size * 0.75;     // X
                vertices[arrayIndex + 1] = vertex[1] * size * 0.75; // Y
                vertices[arrayIndex + 2] = vertex[2] * size * 0.75; // Z
            }
        }

        const normals = calculateNormals(vertices);
        const uvs = generateBasicUVs(triangulatedFaces.length); // 36 triangular faces from 12 pentagons

        d12Geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        d12Geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        d12Geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        return d12Geometry;
    }, [size]);

    return <DiceGeometry {...props} geometry={geometry} />;
};

D12Geometry.diceType = 'd12'; 