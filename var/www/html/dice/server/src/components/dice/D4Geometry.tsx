import React from 'react';
import * as THREE from 'three';
import { DiceGeometry, calculateNormals, generateBasicUVs } from './DiceGeometry';
import type { DiceGeometryComponent } from './DiceGeometry';

/**
 * D4 Tetrahedron Geometry Component
 * Creates a custom D4 geometry that matches physics vertices exactly
 */
export const D4Geometry: DiceGeometryComponent = (props) => {
    const { size } = props;

    const geometry = React.useMemo(() => {
        const d4Geometry = new THREE.BufferGeometry();

        const vertices = new Float32Array([
            // Face 1: [0, 1, 2] - base triangle
            -0.5 * size, 0 * size, -0.289 * size,  // vertex 0
            0.5 * size, 0 * size, -0.289 * size,   // vertex 1
            0 * size, 0 * size, 0.577 * size,      // vertex 2

            // Face 2: [0, 3, 1] - front face
            -0.5 * size, 0 * size, -0.289 * size,  // vertex 0
            0 * size, 0.816 * size, 0 * size,      // vertex 3
            0.5 * size, 0 * size, -0.289 * size,   // vertex 1

            // Face 3: [1, 3, 2] - right face
            0.5 * size, 0 * size, -0.289 * size,   // vertex 1
            0 * size, 0.816 * size, 0 * size,      // vertex 3
            0 * size, 0 * size, 0.577 * size,      // vertex 2

            // Face 4: [2, 3, 0] - left face
            0 * size, 0 * size, 0.577 * size,      // vertex 2
            0 * size, 0.816 * size, 0 * size,      // vertex 3
            -0.5 * size, 0 * size, -0.289 * size,  // vertex 0
        ]);

        const normals = calculateNormals(vertices);
        const uvs = generateBasicUVs(4); // 4 triangular faces

        d4Geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        d4Geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        d4Geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        return d4Geometry;
    }, [size]);

    return <DiceGeometry {...props} geometry={geometry} />;
};

D4Geometry.diceType = 'd4'; 