import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

// Define a minimal interface for OrbitControls to avoid type issues
interface OrbitControlsLike {
    enabled: boolean;
    reset(): void;
    target: THREE.Vector3;
    object: THREE.Camera;
    update(): void;
}

export interface CameraControlsState {
    isFullScreen: boolean;
    isCameraLocked: boolean;
}

export interface CameraControlsOperations {
    toggleFullScreen: () => void;
    toggleCameraLock: () => void;
    resetCamera: () => void;
    jumpToPosition: (position: { x: number; y: number; z: number }) => void;
}

export interface CameraControlsProps {
    // Currently no props needed, but interface kept for future extensibility
    [key: string]: unknown;
}

/**
 * Custom hook for managing camera controls and fullscreen state
 * Extracted from DiceCanvas for better separation of concerns
 */
export function useCameraControls(_props: CameraControlsProps = {}): [
    CameraControlsState,
    CameraControlsOperations,
    React.RefObject<OrbitControlsLike | null>
] {
    const [isCameraLocked, setIsCameraLocked] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const controlsRef = useRef<OrbitControlsLike | null>(null);

    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.enabled = !isCameraLocked;
        }
    }, [isCameraLocked]);

    const toggleCameraLock = useCallback(() => {
        setIsCameraLocked(prev => {
            const newValue = !prev;
            console.log(`📷 Camera ${newValue ? 'locked' : 'unlocked'}`);
            return newValue;
        });
    }, []);

    const resetCamera = useCallback(() => {
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
    }, []);

    const toggleFullScreen = useCallback(() => {
        setIsFullScreen(prev => !prev);
    }, []);

    const jumpToPosition = useCallback((position: { x: number; y: number; z: number }) => {
        if (controlsRef.current) {
            const controls = controlsRef.current;

            const cameraOffset = { x: 30, y: 20, z: 30 };
            const cameraPosition = {
                x: position.x + cameraOffset.x,
                y: position.y + cameraOffset.y,
                z: position.z + cameraOffset.z
            };

            const lookAtTarget = position;

            controls.target.set(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);

            if (controls.object) {
                controls.object.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
                controls.object.lookAt(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);
            }

            controls.update();

            console.log(`📷 Camera jumped to position:`, cameraPosition, `looking at:`, lookAtTarget);
        }
    }, []);

    const state: CameraControlsState = useMemo(() => ({
        isFullScreen,
        isCameraLocked
    }), [isFullScreen, isCameraLocked]);

    const operations: CameraControlsOperations = useMemo(() => ({
        toggleFullScreen,
        toggleCameraLock,
        resetCamera,
        jumpToPosition
    }), [toggleFullScreen, toggleCameraLock, resetCamera, jumpToPosition]);

    return [state, operations, controlsRef];
}