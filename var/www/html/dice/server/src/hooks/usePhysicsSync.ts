import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export interface UsePhysicsSyncProps {
    diceBody: CANNON.Body;
    meshRef: React.RefObject<THREE.Mesh | null>;
    targetPosition?: THREE.Vector3 | null;
    isDragging?: boolean;
}

/**
 * Custom hook for synchronizing physics body with Three.js mesh
 * Handles both normal physics sync and drag-based position updates
 * Extracted from PhysicsDice component for better reusability
 */
export const usePhysicsSync = ({
    diceBody,
    meshRef,
    targetPosition,
    isDragging = false
}: UsePhysicsSyncProps) => {
    useFrame(() => {
        if (!meshRef.current || !diceBody) return;

        if (isDragging && targetPosition) {
            // During drag: update physics body position with lag/momentum
            const currentPos = new THREE.Vector3(
                diceBody.position.x,
                diceBody.position.y,
                diceBody.position.z
            );

            // Calculate lag - dice follows target with some delay (like a heavy object)
            // Make downward movement more responsive to reduce lag
            const movementDirection = new THREE.Vector3();
            movementDirection.subVectors(targetPosition, currentPos);

            // Base lag factor
            let lagFactor = 0.08;

            // Increase responsiveness for downward movement to reduce lag
            if (movementDirection.y < 0) {
                lagFactor = Math.min(0.15, lagFactor + Math.abs(movementDirection.y) * 0.02);
            }

            const newPos = currentPos.clone();
            newPos.lerp(targetPosition, lagFactor);

            // Calculate velocity for momentum
            const newVelocity = new THREE.Vector3();
            newVelocity.subVectors(newPos, currentPos);
            newVelocity.multiplyScalar(60); // Convert to per-second velocity

            // Update physics body position
            diceBody.position.set(newPos.x, newPos.y, newPos.z);

            // Add rotation based on movement velocity for realistic feel
            const movementSpeed = newVelocity.length();
            if (movementSpeed > 0.1) {
                const rotationAxis = new CANNON.Vec3(
                    newVelocity.z,   // Z velocity affects X rotation
                    0,               // No Y rotation during drag
                    -newVelocity.x   // X velocity affects Z rotation
                ).unit();
                const rotationSpeed = movementSpeed * 0.02;
                diceBody.quaternion.setFromAxisAngle(rotationAxis, rotationSpeed);
            }

            // Update mesh to match physics body
            meshRef.current.position.copy(diceBody.position as any);
            meshRef.current.quaternion.copy(diceBody.quaternion as any);
        } else {
            // Normal physics sync: copy from physics body to mesh
            meshRef.current.position.copy(diceBody.position as any);
            meshRef.current.quaternion.copy(diceBody.quaternion as any);
        }
    });
}; 