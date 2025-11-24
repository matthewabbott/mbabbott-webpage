import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

import { DiceD6, DiceD4, DiceD8, DiceD10, DiceD12, DiceD20 } from '../physics';

import { DICE_GEOMETRIES } from './dice';
import { PhysicsWorld, PhysicsGround } from './physics';
import { RemoteDiceRenderer } from './sync';
import { useDiceInteraction, usePhysicsSync, useCanvasSync } from '../hooks';
import { useHighlighting } from '../hooks/useHighlighting';
import { useDiceResultOverlays } from '../hooks/canvas/useDiceResultOverlays';
import { useGlobalHotkeys, type HotkeyActions } from '../hooks/useGlobalHotkeys';
import { DiceResultOverlay } from './canvas/DiceResultOverlay';
import type { CameraControlsState, CameraControlsOperations } from '../hooks/controls/useCameraControls';

// Extend R3F with the geometry we need
extend({ EdgesGeometry: THREE.EdgesGeometry });

interface DiceCanvasProps {
    // Camera controls passed from parent
    cameraState: CameraControlsState;
    cameraOperations: CameraControlsOperations;
    controlsRef: React.RefObject<any>;
}

// Define available dice types (now imported from hooks)
type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
type DiceInstance = (DiceD4 | DiceD6 | DiceD8 | DiceD10 | DiceD12 | DiceD20) & { canvasId?: string };

// Dice configuration
const DICE_CONFIG = {
    d4: {
        name: 'D4 (Tetrahedron)',
        emoji: '▲',
        min: 1,
        max: 4,
        color: '#ff6b6b',
        isAvailable: true,
        create: () => new DiceD4({ size: 1 })
    },
    d6: {
        name: 'D6 (Cube)',
        emoji: '⬜',
        min: 1,
        max: 6,
        color: '#4ecdc4',
        isAvailable: true,
        create: () => new DiceD6({ size: 1 })
    },
    d8: {
        name: 'D8 (Octahedron)',
        emoji: '🔸',
        min: 1,
        max: 8,
        color: '#45b7d1',
        isAvailable: true,
        create: () => new DiceD8({ size: 1 })
    },
    d10: {
        name: 'D10 (Pentagonal Trapezohedron)',
        emoji: '🔟',
        min: 1,
        max: 10,
        color: '#96ceb4',
        isAvailable: true,
        create: () => new DiceD10({ size: 1 })
    },
    d12: {
        name: 'D12 (Dodecahedron)',
        emoji: '⬡',
        min: 1,
        max: 12,
        color: '#feca57',
        isAvailable: true,
        create: () => new DiceD12({ size: 1 })
    },
    d20: {
        name: 'D20 (Icosahedron)',
        emoji: '🔴',
        min: 1,
        max: 20,
        color: '#ff9ff3',
        isAvailable: true,
        create: () => new DiceD20({ size: 1 })
    }
};

// Enhanced Physics Dice Component that renders actual dice geometry
const PhysicsDice: React.FC<{ dice: DiceInstance; canvasId?: string }> = ({ dice, canvasId }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const cameraRef = useRef<THREE.Camera | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Add highlighting functionality
    const { highlightFromDice, isDiceHighlighted } = useHighlighting();

    // Store camera and canvas references for use in event handlers
    useFrame((state) => {
        cameraRef.current = state.camera;
        canvasRef.current = state.gl.domElement;
    });

    // Use the new dice interaction hook
    const [interactionState, interactionHandlers] = useDiceInteraction({
        diceBody: dice.body,
        meshRef,
        cameraRef,
        canvasRef
    });

    // Use the new physics sync hook
    usePhysicsSync({
        diceBody: dice.body,
        meshRef,
        targetPosition: interactionState.targetPosition,
        isDragging: interactionState.isDragging
    });

    // Check if this dice is highlighted
    const isHighlighted = canvasId ? isDiceHighlighted(canvasId) : false;

    // Handle dice click for highlighting
    const handleDiceClick = useCallback((event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        console.log(`🎲 Dice clicked with canvasId: "${canvasId}"`);
        if (canvasId) {
            highlightFromDice(canvasId);
        } else {
            console.warn('🎲 Dice clicked but no canvasId provided');
        }
    }, [canvasId, highlightFromDice]);

    // Normalize dice type to lowercase for lookup
    const normalizedDiceType = dice.diceType.toLowerCase() as DiceType;

    // Get dice configuration for colors and geometry
    const diceConfig = DICE_CONFIG[normalizedDiceType as keyof typeof DICE_CONFIG];
    const GeometryComponent = DICE_GEOMETRIES[normalizedDiceType as keyof typeof DICE_GEOMETRIES];

    if (!diceConfig) {
        console.warn(`Unknown dice type: "${dice.diceType}" (normalized: "${normalizedDiceType}"). Available types:`, Object.keys(DICE_CONFIG));
    }

    const diceColor = diceConfig?.color || '#888888';

    const enhancedPointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
        interactionHandlers.handlePointerDown(event);
        handleDiceClick(event);
    }, [interactionHandlers.handlePointerDown, handleDiceClick]);

    // Render using the new geometry components
    if (GeometryComponent) {
        return (
            <GeometryComponent
                key={`dice-${dice.diceType}`}
                size={dice.options.size}
                color={diceColor}
                isHovered={interactionState.isHovered}
                isHighlighted={isHighlighted}
                onPointerDown={enhancedPointerDown}
                onPointerMove={interactionHandlers.handlePointerMove}
                onPointerUp={interactionHandlers.handlePointerUp}
                onPointerEnter={interactionHandlers.handlePointerEnter}
                onPointerLeave={interactionHandlers.handlePointerLeave}
                meshRef={meshRef as React.RefObject<THREE.Mesh>}
            />
        );
    } else {
        // Fallback for unknown dice types
        return (
            <mesh
                key={`dice-${dice.diceType}`}
                ref={meshRef}
                castShadow
                receiveShadow
                onPointerDown={enhancedPointerDown}
                onPointerMove={interactionHandlers.handlePointerMove}
                onPointerUp={interactionHandlers.handlePointerUp}
                onPointerEnter={interactionHandlers.handlePointerEnter}
                onPointerLeave={interactionHandlers.handlePointerLeave}
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color={diceColor}
                    roughness={interactionState.isHovered || isHighlighted ? 0.1 : 0.3}
                    metalness={interactionState.isHovered || isHighlighted ? 0.3 : 0.1}
                    emissive={isHighlighted ? diceColor : (interactionState.isHovered ? '#888888' : '#000000')}
                    emissiveIntensity={isHighlighted ? 0.3 : (interactionState.isHovered ? 0.1 : 0)}
                />
            </mesh>
        );
    }
};

// Virtual Dice Renderer Component
interface VirtualDiceData {
    canvasId: string;
    diceType: string;
    position?: { x: number; y: number; z: number };
    isVirtual: boolean;
    virtualRolls?: number[];
    result?: number;
}

interface VirtualDiceRendererProps {
    virtualDice: VirtualDiceData[];
    onVirtualDiceClick?: (diceId: string) => void;
}

const VirtualDiceRenderer: React.FC<VirtualDiceRendererProps> = ({
    virtualDice,
    onVirtualDiceClick
}) => {
    const { isDiceHighlighted } = useHighlighting();

    return (
        <>
            {virtualDice.map((dice) => {
                const isHighlightedDice = isDiceHighlighted(dice.canvasId);
                const position = dice.position || { x: 0, y: 2, z: 0 };

                return (
                    <group key={dice.canvasId}>
                        {/* Virtual Dice Placeholder */}
                        <mesh
                            position={[position.x, position.y, position.z]}
                            onClick={() => onVirtualDiceClick?.(dice.canvasId)}
                        >
                            <boxGeometry args={[1, 1, 1]} />
                            <meshStandardMaterial
                                color={isHighlightedDice ? "#9333ea" : "#7c3aed"}
                                roughness={0.2}
                                metalness={0.1}
                                emissive={isHighlightedDice ? "#7c3aed" : "#000000"}
                                emissiveIntensity={isHighlightedDice ? 0.3 : 0}
                                transparent
                                opacity={0.8}
                            />
                        </mesh>

                        {/* Virtual Dice Popup */}
                        {isHighlightedDice && (
                            <Html
                                position={[position.x, position.y + 2, position.z]}
                                center
                                distanceFactor={10}
                            >
                                <div className="bg-purple-900 text-white rounded-lg p-3 shadow-xl border border-purple-400 min-w-48">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold bg-purple-400 px-2 py-1 rounded">
                                            VIRTUAL
                                        </span>
                                        <span className="text-sm font-semibold">
                                            {dice.virtualRolls?.length || 0}×{dice.diceType}
                                        </span>
                                    </div>

                                    {/* Main Result */}
                                    <div className="text-center mb-2">
                                        <div className="text-2xl font-bold text-purple-200">
                                            {dice.result || 0}
                                        </div>
                                        <div className="text-xs text-purple-300">Total</div>
                                    </div>

                                    {/* Individual Rolls Preview */}
                                    {dice.virtualRolls && dice.virtualRolls.length > 0 && (
                                        <div className="text-xs">
                                            <div className="text-purple-300 mb-1">Individual rolls:</div>
                                            <div className="grid grid-cols-6 gap-1 max-h-16 overflow-y-auto">
                                                {dice.virtualRolls.slice(0, 12).map((roll, i) => (
                                                    <div key={i} className="bg-purple-700 text-center py-1 rounded">
                                                        {roll}
                                                    </div>
                                                ))}
                                                {dice.virtualRolls.length > 12 && (
                                                    <div className="bg-purple-600 text-center py-1 rounded text-xs">
                                                        +{dice.virtualRolls.length - 12}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Html>
                        )}
                    </group>
                );
            })}
        </>
    );
};

const DiceCanvas: React.FC<DiceCanvasProps> = ({
    cameraState,
    cameraOperations,
    controlsRef
}) => {
    const [isInitialized, setIsInitialized] = useState(false);

    // Canvas synchronization using new sync hooks
    const { remoteDice } = useCanvasSync({
        isInitialized,
        onDiceSettle: (diceId: string, result: number, position: [number, number, number]) => {
            console.log(`🎲 Remote dice ${diceId} settled with result ${result}, showing overlay`);
            showResultOverlay(diceId, result, position);
        }
    });

    const { setCameraJumpCallback, setGetDicePositionCallback, getActivities, isDiceHighlighted } = useHighlighting();

    const virtualDice: VirtualDiceData[] = React.useMemo(() => {
        const allVirtualDice: VirtualDiceData[] = [];
        const activities = getActivities();

        activities.forEach(activity => {
            if (activity.roll?.canvasData?.dice) {
                activity.roll.canvasData.dice.forEach(dice => {
                    if (dice.isVirtual) {
                        allVirtualDice.push(dice);
                    }
                });
            }
        });

        return allVirtualDice;
    }, [getActivities]);

    const {
        overlays: resultOverlays,
        showResultOverlay,
        showGroupSumOverlay,
        updateOverlayPosition,
        removeResultOverlay,
        hasVisibleOverlay
    } = useDiceResultOverlays();

    const hotkeyActions: HotkeyActions = {
        toggleCameraLock: cameraOperations.toggleCameraLock,
        toggleFullScreen: cameraOperations.toggleFullScreen,
        resetCamera: cameraOperations.resetCamera
    };

    useGlobalHotkeys(hotkeyActions, {
        enabled: true,
        showHints: true
    });

    useEffect(() => {
        if (!isInitialized) return;

        const updateHighlightedDiceOverlays = () => {
            const getDicePosition = (diceId: string): [number, number, number] | null => {
                const remoteDie = remoteDice.get(diceId);
                if (remoteDie && remoteDie.body) {
                    return [remoteDie.body.position.x, remoteDie.body.position.y, remoteDie.body.position.z];
                }

                const virtualDie = virtualDice.find(die => die.canvasId === diceId);
                if (virtualDie && virtualDie.position) {
                    return [virtualDie.position.x, virtualDie.position.y, virtualDie.position.z];
                }

                return null;
            };

            const getHighlightedRollData = () => {
                const activities = getActivities();
                const highlightedRolls = new Map<string, { diceIds: string[], total: number, rollId: string }>();

                for (const activity of activities) {
                    if (activity.roll?.canvasData?.dice) {
                        const rollId = activity.id;
                        const highlightedDiceInRoll: string[] = [];
                        let rollTotal = 0;

                        for (const diceData of activity.roll.canvasData.dice) {
                            if (!diceData.isVirtual && isDiceHighlighted(diceData.canvasId)) {
                                highlightedDiceInRoll.push(diceData.canvasId);
                                rollTotal += diceData.result || 0;
                            }
                        }

                        if (highlightedDiceInRoll.length > 0) {
                            highlightedRolls.set(rollId, {
                                diceIds: highlightedDiceInRoll,
                                total: rollTotal,
                                rollId
                            });
                        }
                    }
                }

                return highlightedRolls;
            };

            // Get highlighted roll data
            const highlightedRolls = getHighlightedRollData();

            // Process highlighted rolls and show group sums
            highlightedRolls.forEach(({ diceIds, total, rollId }) => {
                if (diceIds.length > 1) {
                    // Multiple dice from same roll - show group sum
                    showGroupSumOverlay(diceIds, total, rollId, getDicePosition);
                } else if (diceIds.length === 1) {
                    // Single dice - show individual result
                    const diceId = diceIds[0];
                    const position = getDicePosition(diceId);
                    if (position && !hasVisibleOverlay(diceId)) {
                        showResultOverlay(diceId, total, position, rollId, false);
                    }
                }
            });

            // Remove overlays for unhighlighted dice
            const allDiceIds = [
                ...Array.from(remoteDice.keys()),
                ...virtualDice.map(die => die.canvasId)
            ];

            allDiceIds.forEach(diceId => {
                if (!isDiceHighlighted(diceId)) {
                    removeResultOverlay(diceId);
                }
            });

            // Update positions for existing overlays
            resultOverlays.forEach(overlay => {
                const currentPosition = getDicePosition(overlay.diceId);
                if (currentPosition) {
                    updateOverlayPosition(overlay.diceId, currentPosition);
                }
            });
        };

        // Update overlays frequently to catch highlighting changes
        const interval = setInterval(updateHighlightedDiceOverlays, 200); // Check every 200ms

        return () => clearInterval(interval);
    }, [isInitialized, remoteDice, virtualDice, isDiceHighlighted, getActivities, showResultOverlay, showGroupSumOverlay, updateOverlayPosition, removeResultOverlay, hasVisibleOverlay, resultOverlays]);

    // Handle virtual dice click
    const handleVirtualDiceClick = useCallback((diceId: string) => {
        console.log(`🎲 Virtual dice clicked: ${diceId}`);
        // This will be handled by the highlighting system
    }, []);

    // Setup camera jump callback
    useEffect(() => {
        setCameraJumpCallback(cameraOperations.jumpToPosition);
    }, [setCameraJumpCallback, cameraOperations.jumpToPosition]);

    // Setup dice position getter callback
    useEffect(() => {
        const getDicePosition = (diceId: string): { x: number; y: number; z: number } | null => {
            // Check remote dice
            const remoteDie = remoteDice.get(diceId);
            if (remoteDie && remoteDie.body) {
                return {
                    x: remoteDie.body.position.x,
                    y: remoteDie.body.position.y,
                    z: remoteDie.body.position.z
                };
            }

            // Check virtual dice
            const virtualDie = virtualDice.find(die => die.canvasId === diceId);
            if (virtualDie && virtualDie.position) {
                return virtualDie.position;
            }

            return null;
        };

        setGetDicePositionCallback(getDicePosition);
    }, [setGetDicePositionCallback, remoteDice, virtualDice]);

    // Physics initialization is now handled by PhysicsWorld component
    const handlePhysicsInitialized = useCallback((initialized: boolean) => {
        setIsInitialized(initialized);
    }, []);

    const canvasContent = (
        <>
            <Canvas
                className={cameraState.isFullScreen ? "h-screen w-screen" : "w-full h-full"}
                camera={{ position: [12, 36, 72], fov: 20 }}
                gl={{ antialias: true, alpha: false }}
                style={{ backgroundColor: '#1a1f2c' }}
                shadows
                onCreated={({ scene }) => {
                    scene.background = new THREE.Color('#1a1f2c');
                }}
            >
                <OrbitControls ref={controlsRef} enabled={!cameraState.isCameraLocked} />

                {/* Improved lighting setup with larger shadow area */}
                <ambientLight intensity={0.4} />
                <directionalLight
                    position={[5, 10, 5]}
                    intensity={1.2}
                    castShadow
                    shadow-mapSize-width={4096}
                    shadow-mapSize-height={4096}
                    shadow-camera-far={100}
                    shadow-camera-left={-50}
                    shadow-camera-right={50}
                    shadow-camera-top={50}
                    shadow-camera-bottom={-50}
                />
                <directionalLight position={[-5, 5, -5]} intensity={0.3} />
                <pointLight position={[0, 5, 0]} intensity={0.5} />

                {/* Physics World with Ground and Simulation */}
                <PhysicsWorld onInitialized={handlePhysicsInitialized}>
                    {/* Physics Ground */}
                    <PhysicsGround />

                    {/* Remote Dice */}
                    <RemoteDiceRenderer
                        remoteDice={remoteDice}
                        PhysicsDiceComponent={PhysicsDice}
                    />

                    {/* Virtual Dice */}
                    <VirtualDiceRenderer
                        virtualDice={virtualDice}
                        onVirtualDiceClick={handleVirtualDiceClick}
                    />

                    {/* Floating Result Numbers */}
                    {resultOverlays.map((overlay) => (
                        <DiceResultOverlay
                            key={overlay.diceId}
                            diceId={overlay.diceId}
                            result={overlay.result}
                            position={overlay.position}
                            isVisible={overlay.isVisible}
                            onAnimationComplete={() => removeResultOverlay(overlay.diceId)}
                        />
                    ))}
                </PhysicsWorld>
            </Canvas>
        </>
    );

    if (cameraState.isFullScreen) {
        return (
            <div className="fixed inset-0 z-50 bg-gray-900">
                {canvasContent}
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            {/* 3D Canvas */}
            <div className="relative w-full h-full">
                {canvasContent}

                {/* Physics Loading Overlay */}
                {!isInitialized && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center rounded-lg">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                            <div className="animate-spin text-3xl mb-2">🎲</div>
                            <div className="text-gray-900 dark:text-white">Initializing Physics...</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiceCanvas;