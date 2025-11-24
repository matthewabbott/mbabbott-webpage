import React, { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DiceManager } from '../../physics';
import * as CANNON from 'cannon-es';

export interface PhysicsWorldProps {
    onInitialized?: (initialized: boolean) => void;
    children?: React.ReactNode;
}

/**
 * PhysicsWorld Component
 * Manages the physics world initialization and simulation stepping
 * Extracted from DiceCanvas for better separation of concerns
 */
export const PhysicsWorld: React.FC<PhysicsWorldProps> = ({ onInitialized, children }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const worldRef = useRef<CANNON.World | null>(null);

    // Initialize physics world
    useEffect(() => {
        const initPhysics = async () => {
            try {
                if (!DiceManager.isInitialized()) {
                    console.log('🎲 Initializing physics world...');
                    DiceManager.setWorld();

                    // Add air resistance/dampening to make dice behavior more controlled
                    const world = DiceManager.getWorld();
                    if (world) {
                        // Set global dampening to simulate air resistance
                        world.defaultContactMaterial.friction = 0.4;
                        world.defaultContactMaterial.restitution = 0.3;

                        // Add linear and angular dampening to all bodies
                        world.addEventListener('addBody', (event: { body: CANNON.Body }) => {
                            const body = event.body;
                            if (body) {
                                body.linearDamping = 0.1;
                                body.angularDamping = 0.1;
                            }
                        });
                    }
                    console.log('🎲 Physics world initialized successfully');
                }
                setIsInitialized(true);
                onInitialized?.(true);
            } catch (error) {
                console.error('❌ Failed to initialize physics:', error);
                onInitialized?.(false);
            }
        };

        initPhysics();
    }, []); // Remove onInitialized from dependencies to prevent re-runs

    useEffect(() => {
        const world = DiceManager.getWorld();
        worldRef.current = world;

        if (!world) return;

        const handleBodyAdded = (event: { body: CANNON.Body }) => {
            console.log('🌍 Body added to physics world:', event.body.id);
        };

        world.addEventListener('addBody', handleBodyAdded);

        return () => {
            world.removeEventListener('addBody', handleBodyAdded);
        };
    }, []);

    // Step the physics simulation every frame
    useFrame((_state, delta) => {
        if (isInitialized && DiceManager.isInitialized()) {
            DiceManager.step(delta);
        }
    });

    // Only render children when physics is initialized
    return isInitialized ? <>{children}</> : null;
};

