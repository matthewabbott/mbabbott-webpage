import React, { useEffect } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DiceManager, PhysicsUtils } from '../../physics';

export interface PhysicsGroundProps {
    tableSize?: number;
    wallHeight?: number;
    wallThickness?: number;
}

/**
 * PhysicsGround Component
 * Creates the physics ground plane and invisible walls for dice containment
 * Also renders the visual ground mesh with cyberspace grid texture
 * Extracted from DiceCanvas for better separation of concerns
 */
export const PhysicsGround: React.FC<PhysicsGroundProps> = ({
    tableSize = 80,
    wallHeight = 20,
    wallThickness = 1
}) => {
    useEffect(() => {
        const groundShape = PhysicsUtils.createPlaneShape();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        groundBody.position.set(0, -1, 0);

        if (DiceManager.getMaterials()) {
            groundBody.material = DiceManager.getMaterials()!.floor;
        }

        DiceManager.addBody(groundBody);

        const walls = [
            // North wall
            { pos: [0, wallHeight / 2 - 1, -tableSize / 2], size: [tableSize, wallHeight, wallThickness] },
            // South wall  
            { pos: [0, wallHeight / 2 - 1, tableSize / 2], size: [tableSize, wallHeight, wallThickness] },
            // East wall
            { pos: [tableSize / 2, wallHeight / 2 - 1, 0], size: [wallThickness, wallHeight, tableSize] },
            // West wall
            { pos: [-tableSize / 2, wallHeight / 2 - 1, 0], size: [wallThickness, wallHeight, tableSize] },
        ];

        const wallBodies: CANNON.Body[] = [];
        walls.forEach((wall) => {
            const wallShape = new CANNON.Box(new CANNON.Vec3(wall.size[0] / 2, wall.size[1] / 2, wall.size[2] / 2));
            const wallBody = new CANNON.Body({ mass: 0 });
            wallBody.addShape(wallShape);
            wallBody.position.set(wall.pos[0], wall.pos[1], wall.pos[2]);

            if (DiceManager.getMaterials()) {
                wallBody.material = DiceManager.getMaterials()!.floor;
            }

            DiceManager.addBody(wallBody);
            wallBodies.push(wallBody);
        });

        console.log('🎲 Enhanced large sandbox created:', {
            ground: 'Y: -1',
            walls: wallBodies.length,
            tableSize,
            wallHeight
        });

        return () => {
            DiceManager.removeBody(groundBody);
            wallBodies.forEach(wall => DiceManager.removeBody(wall));
        };
    }, [tableSize, wallHeight, wallThickness]);

    const gridTexture = React.useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 320;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#1a1f2c';
        ctx.fillRect(0, 0, 320, 320);

        const gridSize = 64;
        const majorGridSpacing = gridSize * 5;

        // Keep smoothing enabled for better line quality
        ctx.imageSmoothingEnabled = true;

        // First, draw the thin gray lines (regular grid)
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;

        // Draw vertical gray lines (every 64px, but not at the edges to avoid doubling)
        for (let i = gridSize; i < 320; i += gridSize) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 320);
            ctx.stroke();
        }

        // Draw horizontal gray lines (every 64px, but not at the edges to avoid doubling)
        for (let i = gridSize; i < 320; i += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(320, i);
            ctx.stroke();
        }

        // Now draw the major grid lines (thicker, brighter, at the edges and center)
        ctx.strokeStyle = '#cc3333'; // Darker red for major grid lines
        ctx.lineWidth = 4; // Thicker lines
        ctx.globalAlpha = 0.7; // Slightly translucent

        // Draw major vertical grid lines (at 0 and 320, which will tile seamlessly)
        for (let i = 0; i <= 320; i += majorGridSpacing) {
            // Draw glow effect first (wider, more transparent)
            ctx.strokeStyle = '#cc3333';
            ctx.lineWidth = 8;
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 320);
            ctx.stroke();

            // Draw main line (narrower, more opaque)
            ctx.strokeStyle = '#dd4444';
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 320);
            ctx.stroke();
        }

        // Draw major horizontal grid lines (at 0 and 320, which will tile seamlessly)
        for (let i = 0; i <= 320; i += majorGridSpacing) {
            // Draw glow effect first (wider, more transparent)
            ctx.strokeStyle = '#cc3333';
            ctx.lineWidth = 8;
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(320, i);
            ctx.stroke();

            // Draw main line (narrower, more opaque)
            ctx.strokeStyle = '#dd4444';
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(320, i);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        // Use linear filtering for smooth appearance
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;

        // Repeat the 320x320 texture to cover the tableSize x tableSize plane
        const repeats = tableSize / 16; // 16 is the base size for the texture pattern
        texture.repeat.set(repeats, repeats);

        return texture;
    }, [tableSize]);

    return (
        <group>
            {/* Large Cyberspace Mesh Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
                <planeGeometry args={[tableSize, tableSize]} />
                <meshStandardMaterial
                    map={gridTexture}
                    color="#ffffff"
                    roughness={0.7}
                    metalness={0.0}
                    transparent={false}
                    emissive="#111111"
                />
            </mesh>

            {/* Visible Wall Borders (cyberspace style) */}
            {[
                // North border
                { pos: [0, 0, -tableSize / 2] as [number, number, number], size: [tableSize, 4, 1] as [number, number, number] },
                // South border
                { pos: [0, 0, tableSize / 2] as [number, number, number], size: [tableSize, 4, 1] as [number, number, number] },
                // East border
                { pos: [tableSize / 2, 0, 0] as [number, number, number], size: [1, 4, tableSize] as [number, number, number] },
                // West border
                { pos: [-tableSize / 2, 0, 0] as [number, number, number], size: [1, 4, tableSize] as [number, number, number] },
            ].map((border, index) => (
                <mesh key={index} position={border.pos} receiveShadow castShadow>
                    <boxGeometry args={border.size} />
                    <meshStandardMaterial
                        color="#444444"
                        roughness={0.8}
                        metalness={0.2}
                        transparent={true}
                        opacity={0.8}
                    />
                </mesh>
            ))}
        </group>
    );
}; 