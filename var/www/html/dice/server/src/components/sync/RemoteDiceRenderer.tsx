import React from 'react';
import { DiceD4, DiceD6, DiceD8, DiceD10, DiceD12, DiceD20 } from '../../physics';

// Define available dice types
type DiceInstance = DiceD4 | DiceD6 | DiceD8 | DiceD10 | DiceD12 | DiceD20;

// Import the PhysicsDice component type (we'll need to extract this interface)
interface PhysicsDiceProps {
    dice: DiceInstance;
    canvasId?: string;
}

export interface RemoteDiceRendererProps {
    remoteDice: Map<string, DiceInstance>;
    PhysicsDiceComponent: React.FC<PhysicsDiceProps>;
}

/**
 * RemoteDiceRenderer Component
 * Renders all remote dice from other users
 * Extracted from DiceCanvas for better separation of concerns
 */
export const RemoteDiceRenderer: React.FC<RemoteDiceRendererProps> = ({
    remoteDice,
    PhysicsDiceComponent
}) => {
    return (
        <>
            {Array.from(remoteDice.entries()).map(([diceId, die]) => (
                <PhysicsDiceComponent key={`remote-${diceId}`} dice={die} canvasId={diceId} />
            ))}
        </>
    );
}; 