import React from 'react';
import * as THREE from 'three';
import { DiceGeometry, calculateNormals, generateBasicUVs } from './DiceGeometry';
import type { DiceGeometryComponent } from './DiceGeometry';

/**
 * D8 Octahedron Geometry Component
 * Creates a custom D8 geometry that matches physics vertices exactly
 */
export const D8Geometry: DiceGeometryComponent = (props) => {
    const { size } = props;

    const geometry = React.useMemo(() => {
        const d8Geometry = new THREE.BufferGeometry();

        // D8 octahedron vertices (from D8Geometry.ts)
        const octahedronVertices = [
            [0, 1, 0],     // 0: top vertex
            [1, 0, 0],     // 1: positive X
            [0, 0, 1],     // 2: positive Z
            [-1, 0, 0],    // 3: negative X
            [0, 0, -1],    // 4: negative Z
            [0, -1, 0],    // 5: bottom vertex
        ];

        // D8 faces (8 triangular faces) - corrected winding order (CCW from outside)
        const octahedronFaces = [
            [0, 2, 1], [0, 3, 2], [0, 4, 3], [0, 1, 4], // Upper pyramid - fixed winding
            [5, 1, 2], [5, 2, 3], [5, 3, 4], [5, 4, 1], // Lower pyramid - fixed winding
        ];

        // Build vertices array for triangulated octahedron
        const vertices = new Float32Array(octahedronFaces.length * 9); // 8 faces * 3 vertices * 3 coords
        for (let faceIndex = 0; faceIndex < octahedronFaces.length; faceIndex++) {
            const face = octahedronFaces[faceIndex];
            for (let vertexIndex = 0; vertexIndex < 3; vertexIndex++) {
                const vertex = octahedronVertices[face[vertexIndex]];
                const arrayIndex = faceIndex * 9 + vertexIndex * 3;
                vertices[arrayIndex] = vertex[0] * size;     // X
                vertices[arrayIndex + 1] = vertex[1] * size; // Y
                vertices[arrayIndex + 2] = vertex[2] * size; // Z
            }
        }

        const normals = calculateNormals(vertices);
        const uvs = generateBasicUVs(8); // 8 triangular faces

        d8Geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        d8Geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        d8Geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        return d8Geometry;
    }, [size]);

    return <DiceGeometry {...props} geometry={geometry} />;
};

D8Geometry.diceType = 'd8'; 