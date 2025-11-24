import React from 'react';
import * as THREE from 'three';
import { DiceGeometry, generateBasicUVs } from './DiceGeometry';
import type { DiceGeometryComponent } from './DiceGeometry';

/**
 * D10 Pentagonal Trapezohedron Geometry Component
 * Creates a custom D10 geometry that matches physics vertices exactly
 */
export const D10Geometry: DiceGeometryComponent = (props) => {
    const { size } = props;

    const geometry = React.useMemo(() => {
        const d10Geometry = new THREE.BufferGeometry();

        // Generate D10 vertices programmatically (same as D10Geometry.ts)
        const d10Vertices = [];

        // Generate 10 vertices in a circle with alternating Z heights
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 / 10) * i; // 36 degrees apart
            const x = Math.cos(angle);
            const y = Math.sin(angle);
            // Alternate between +0.105 and -0.105 for Z coordinate
            const z = 0.105 * (i % 2 ? 1 : -1);
            d10Vertices.push([x, y, z]);
        }

        // Add top and bottom vertices
        d10Vertices.push([0, 0, -1]); // Bottom vertex (index 10)
        d10Vertices.push([0, 0, 1]);  // Top vertex (index 11)

        // D10 faces (20 faces total: 10 kite + 10 triangular) - exact layout from original threejs-dice
        const d10Faces = [
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
        ];

        // Triangulate mixed face types (kite-shaped and triangular)
        const triangulatedFaces = [];
        const faceGroups = []; // Track which original face each triangle belongs to
        for (let i = 0; i < d10Faces.length; i++) {
            const face = d10Faces[i];

            if (face.length === 4) {
                // Kite-shaped face: triangulate as [v0,v1,v2] and [v0,v2,v3]
                triangulatedFaces.push([face[0], face[1], face[2]]);
                triangulatedFaces.push([face[0], face[2], face[3]]);
                faceGroups.push(i); // Both triangles belong to the same kite face
                faceGroups.push(i);
            } else if (face.length === 3) {
                // Triangular face: use as-is
                triangulatedFaces.push([face[0], face[1], face[2]]);
                faceGroups.push(i);
            }
        }

        // Pre-calculate face normals for each original face (to smooth kite faces)
        const faceNormals = [];
        for (let i = 0; i < d10Faces.length; i++) {
            const face = d10Faces[i];

            // Calculate normal using first 3 vertices of the face
            const v1 = new THREE.Vector3(
                d10Vertices[face[0]][0] * size * 0.9,
                d10Vertices[face[0]][1] * size * 0.9,
                d10Vertices[face[0]][2] * size * 0.9
            );
            const v2 = new THREE.Vector3(
                d10Vertices[face[1]][0] * size * 0.9,
                d10Vertices[face[1]][1] * size * 0.9,
                d10Vertices[face[1]][2] * size * 0.9
            );
            const v3 = new THREE.Vector3(
                d10Vertices[face[2]][0] * size * 0.9,
                d10Vertices[face[2]][1] * size * 0.9,
                d10Vertices[face[2]][2] * size * 0.9
            );

            const normal = new THREE.Vector3()
                .crossVectors(v2.clone().sub(v1), v3.clone().sub(v1))
                .normalize();

            faceNormals.push(normal);
        }

        // Build vertices array for triangulated D10
        const vertices = new Float32Array(triangulatedFaces.length * 9); // triangles * 3 vertices * 3 coords
        for (let faceIndex = 0; faceIndex < triangulatedFaces.length; faceIndex++) {
            const face = triangulatedFaces[faceIndex];
            for (let vertexIndex = 0; vertexIndex < 3; vertexIndex++) {
                const vertex = d10Vertices[face[vertexIndex]];
                const arrayIndex = faceIndex * 9 + vertexIndex * 3;
                // Apply size scaling and geometry scale factor (0.9 for D10)
                vertices[arrayIndex] = vertex[0] * size * 0.9;     // X
                vertices[arrayIndex + 1] = vertex[1] * size * 0.9; // Y
                vertices[arrayIndex + 2] = vertex[2] * size * 0.9; // Z
            }
        }

        // Calculate normals using the pre-calculated face normals (this smooths kite faces)
        const normals = new Float32Array(vertices.length);
        for (let i = 0; i < triangulatedFaces.length; i++) {
            const originalFaceIndex = faceGroups[i];
            const faceNormal = faceNormals[originalFaceIndex];

            const normalOffset = i * 9;

            // Apply the same face normal to all three vertices of this triangle
            // This ensures kite faces appear smooth (both triangles share the same normal)
            normals[normalOffset] = faceNormal.x;
            normals[normalOffset + 1] = faceNormal.y;
            normals[normalOffset + 2] = faceNormal.z;
            normals[normalOffset + 3] = faceNormal.x;
            normals[normalOffset + 4] = faceNormal.y;
            normals[normalOffset + 5] = faceNormal.z;
            normals[normalOffset + 6] = faceNormal.x;
            normals[normalOffset + 7] = faceNormal.y;
            normals[normalOffset + 8] = faceNormal.z;
        }

        const uvs = generateBasicUVs(triangulatedFaces.length);

        d10Geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        d10Geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        d10Geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        return d10Geometry;
    }, [size]);

    return <DiceGeometry {...props} geometry={geometry} />;
};

D10Geometry.diceType = 'd10'; 