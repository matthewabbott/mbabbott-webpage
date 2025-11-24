import { useState, useCallback } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export interface DiceInteractionState {
    isDragging: boolean;
    isHovered: boolean;
    dragStart: { x: number; y: number; time: number; worldPos: THREE.Vector3 } | null;
    dragCurrent: { x: number; y: number } | null;
    originalPosition: THREE.Vector3 | null;
    targetPosition: THREE.Vector3 | null;
    velocity: THREE.Vector3;
    positionHistory: Array<{ pos: THREE.Vector3; time: number }>;
}

export interface DiceInteractionHandlers {
    handlePointerDown: (event: ThreeEvent<PointerEvent>) => void;
    handlePointerMove: (event: ThreeEvent<PointerEvent>) => void;
    handlePointerUp: (event: ThreeEvent<PointerEvent>) => void;
    handlePointerEnter: () => void;
    handlePointerLeave: () => void;
}

export interface UseDiceInteractionProps {
    diceBody: CANNON.Body;
    meshRef: React.RefObject<THREE.Mesh | null>;
    cameraRef: React.RefObject<THREE.Camera | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

/**
 * Custom hook for handling dice interaction (click, drag, throw mechanics)
 * Extracted from PhysicsDice component for better reusability and testing
 */
export const useDiceInteraction = ({
    diceBody,
    meshRef,
    cameraRef,
    canvasRef
}: UseDiceInteractionProps): [DiceInteractionState, DiceInteractionHandlers] => {
    // Interaction state
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number; time: number; worldPos: THREE.Vector3 } | null>(null);
    const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
    const [originalPosition, setOriginalPosition] = useState<THREE.Vector3 | null>(null);
    const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);
    const [velocity, setVelocity] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
    const [positionHistory, setPositionHistory] = useState<Array<{ pos: THREE.Vector3; time: number }>>([]);

    const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
        // Only handle dice throwing if Shift key is held down
        if (!event.shiftKey) {
            return;
        }

        event.stopPropagation();

        // Capture pointer for smooth dragging
        if (event.target && 'setPointerCapture' in event.target) {
            (event.target as Element).setPointerCapture(event.pointerId);
        }

        // Store original position for physics restoration
        const currentPos = new THREE.Vector3(
            diceBody.position.x,
            diceBody.position.y,
            diceBody.position.z
        );
        setOriginalPosition(currentPos);

        // Get world position of the dice when drag starts
        const worldPos = new THREE.Vector3();
        if (meshRef.current) {
            meshRef.current.getWorldPosition(worldPos);
        }

        setIsDragging(true);
        setDragStart({
            x: event.clientX,
            y: event.clientY,
            time: Date.now(),
            worldPos: worldPos
        });
        setDragCurrent({ x: event.clientX, y: event.clientY });
        setTargetPosition(worldPos.clone());
        setVelocity(new THREE.Vector3(0, 0, 0));
        setPositionHistory([{ pos: worldPos.clone(), time: Date.now() }]);

        // Make dice kinematic (not affected by physics) during drag
        diceBody.type = CANNON.Body.KINEMATIC;
        diceBody.velocity.set(0, 0, 0);
        diceBody.angularVelocity.set(0, 0, 0);
    }, [diceBody, meshRef]);

    const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
        if (isDragging && dragStart && meshRef.current && cameraRef.current && canvasRef.current) {
            setDragCurrent({ x: event.clientX, y: event.clientY });

            // Get canvas and camera from stored refs
            const camera = cameraRef.current as THREE.PerspectiveCamera;
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();

            // Calculate mouse movement in pixels
            const deltaX = event.clientX - dragStart.x;
            const deltaY = event.clientY - dragStart.y;

            // Convert pixel movement to normalized movement (-1 to 1 range)
            const normalizedDeltaX = (deltaX / rect.width) * 2;
            const normalizedDeltaY = -(deltaY / rect.height) * 2; // Negative because screen Y is inverted

            // Get camera's right and up vectors (these define the camera's view plane)
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);

            // Calculate right vector (camera's local X axis) - FIXED: reversed for correct direction
            const right = new THREE.Vector3();
            right.crossVectors(cameraDirection, camera.up).normalize(); // Swapped order to fix left/right

            // Calculate up vector (camera's local Y axis)
            const up = new THREE.Vector3();
            up.crossVectors(right, cameraDirection).normalize();

            // Scale movement based on camera's field of view and distance for natural feel
            // Use a more stable scaling that doesn't amplify movement with camera tilt
            const fov = camera.fov || 75; // Default FOV if not available
            const aspect = camera.aspect || 1;

            // Calculate movement scale based on camera's view frustum at the dice's distance
            // This provides consistent movement regardless of camera angle
            const distanceFromCamera = camera.position.distanceTo(dragStart.worldPos);
            const viewHeight = 2 * Math.tan((fov * Math.PI / 180) / 2) * distanceFromCamera;
            const viewWidth = viewHeight * aspect;

            // Scale movement to match screen space - this gives 1:1 mouse-to-world movement
            const movementScaleX = viewWidth / 2;  // Half view width for normalized coordinates
            const movementScaleY = viewHeight / 2; // Half view height for normalized coordinates

            // Calculate target position in world space using camera's right and up vectors
            const worldMovement = new THREE.Vector3();
            worldMovement.addScaledVector(right, normalizedDeltaX * movementScaleX);
            worldMovement.addScaledVector(up, normalizedDeltaY * movementScaleY);

            // Calculate new target position
            const newTargetPosition = dragStart.worldPos.clone();
            newTargetPosition.add(worldMovement);

            // Allow dice to get very close to the ground for knocking into other dice
            // Only prevent going underground, not hovering above it
            newTargetPosition.y = Math.max(newTargetPosition.y, 0.1); // Much lower constraint

            setTargetPosition(newTargetPosition);

            // Update position history for velocity calculation
            const currentTime = Date.now();
            setPositionHistory(prev => {
                const newHistory = [...prev, { pos: newTargetPosition.clone(), time: currentTime }];
                // Keep only last 10 positions (for velocity calculation)
                return newHistory.slice(-10);
            });
        }
    }, [isDragging, dragStart, meshRef, cameraRef, canvasRef]);

    const handlePointerUp = useCallback((event: ThreeEvent<PointerEvent>) => {
        if (isDragging && dragStart && dragCurrent) {
            // Restore physics body to dynamic
            if (diceBody) {
                diceBody.type = CANNON.Body.DYNAMIC;
                diceBody.wakeUp();
            }

            // Release pointer capture
            if (event.target && 'releasePointerCapture' in event.target) {
                (event.target as Element).releasePointerCapture(event.pointerId);
            }

            // Calculate throwing velocity based on recent movement history
            let throwVelocity = new THREE.Vector3(0, 0, 0);

            if (positionHistory.length >= 2) {
                // Use position history to calculate average velocity over last few frames
                const recentHistory = positionHistory.slice(-5); // Last 5 positions
                const timeSpan = recentHistory[recentHistory.length - 1].time - recentHistory[0].time;

                if (timeSpan > 0) {
                    const positionDelta = new THREE.Vector3();
                    positionDelta.subVectors(
                        recentHistory[recentHistory.length - 1].pos,
                        recentHistory[0].pos
                    );

                    // Convert to velocity (units per second)
                    throwVelocity = positionDelta.multiplyScalar(1000 / timeSpan);

                    // Apply throwing force multiplier
                    const throwMultiplier = 1.0;
                    throwVelocity.multiplyScalar(throwMultiplier);

                    // Remove upward force - let dice follow mouse trajectory in camera plane
                    // No artificial upward force added - pure mouse trajectory following
                }
            }

            // If no significant movement, just let it drop gently
            if (throwVelocity.length() < 0.5) {
                throwVelocity.set(0, -1, 0); // Gentler downward velocity
            }

            // No speed cap - let players fling dice as hard as they want!
            // Removed: Cap maximum throwing velocity to prevent dice from flying too far

            // Apply the calculated velocity
            diceBody.velocity.set(throwVelocity.x, throwVelocity.y, throwVelocity.z);

            // Add rotational velocity based on throw direction and speed (reduced intensity)
            const throwSpeed = throwVelocity.length();
            const rotationIntensity = Math.min(throwSpeed * 0.3, 10); // Reduced from 0.5 and capped at 10

            diceBody.angularVelocity.set(
                (Math.random() - 0.5) * rotationIntensity + throwVelocity.z * 0.05, // Reduced influence
                (Math.random() - 0.5) * rotationIntensity,
                (Math.random() - 0.5) * rotationIntensity - throwVelocity.x * 0.05  // Reduced influence
            );

            console.log('🎲 Dice thrown with controlled physics:', {
                throwVelocity: throwVelocity.toArray(),
                throwSpeed: throwSpeed,
                rotationIntensity: rotationIntensity
            });
        }

        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);
        setOriginalPosition(null);
        setTargetPosition(null);
        setVelocity(new THREE.Vector3(0, 0, 0));
        setPositionHistory([]);
    }, [isDragging, dragStart, dragCurrent, diceBody, positionHistory]);

    const handlePointerEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const handlePointerLeave = useCallback(() => {
        setIsHovered(false);
        // If dragging is interrupted by leaving the mesh, clean up
        if (isDragging) {
            diceBody.type = CANNON.Body.DYNAMIC;
            setIsDragging(false);
            setDragStart(null);
            setDragCurrent(null);
            setOriginalPosition(null);
        }
    }, [isDragging, diceBody]);

    const state: DiceInteractionState = {
        isDragging,
        isHovered,
        dragStart,
        dragCurrent,
        originalPosition,
        targetPosition,
        velocity,
        positionHistory
    };

    const handlers: DiceInteractionHandlers = {
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerEnter,
        handlePointerLeave
    };

    return [state, handlers];
}; 