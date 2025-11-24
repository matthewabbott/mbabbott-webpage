import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AnimatedMaterialProps {
    color: string;
    isHovered?: boolean;
    isHighlighted?: boolean;
    roughness?: number;
    metalness?: number;
    baseEmissiveIntensity?: number;
    pulseSpeed?: number;
    pulseIntensity?: number;
}

export const AnimatedMaterial: React.FC<AnimatedMaterialProps> = ({
    color,
    isHovered = false,
    isHighlighted = false,
    roughness,
    metalness,
    baseEmissiveIntensity = 0.1,
    pulseSpeed = 2,
    pulseIntensity = 0.4
}) => {
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);

    useFrame((state) => {
        if (materialRef.current && isHighlighted) {
            // Create pulsating effect using sine wave
            const time = state.clock.getElapsedTime();
            const pulse = Math.sin(time * pulseSpeed) * 0.5 + 0.5; // Normalize to 0-1
            materialRef.current.emissiveIntensity = baseEmissiveIntensity + (pulse * pulseIntensity);
        }
    });

    // Determine material properties based on state
    const materialRoughness = roughness ?? (isHovered ? 0.1 : 0.3);
    const materialMetalness = metalness ?? (isHovered ? 0.3 : 0.1);

    let emissiveColor = '#000000';
    let emissiveIntensity = 0;

    if (isHighlighted) {
        emissiveColor = color;
        emissiveIntensity = baseEmissiveIntensity; // Will be animated by useFrame
    } else if (isHovered) {
        emissiveColor = color;
        emissiveIntensity = 0.1;
    }

    return (
        <meshStandardMaterial
            ref={materialRef}
            color={color}
            roughness={materialRoughness}
            metalness={materialMetalness}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
        />
    );
}; 