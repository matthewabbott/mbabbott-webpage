import React, { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';

export interface DiceResultOverlayProps {
    diceId: string;
    result: number;
    position: [number, number, number];
    isVisible: boolean;
    onAnimationComplete?: () => void;
}

/**
 * Floating result number overlay that appears above dice when they settle
 * Shows the dice result with a smooth animation: appear -> visible -> fade out
 */
export const DiceResultOverlay: React.FC<DiceResultOverlayProps> = ({
    diceId: _diceId,
    result,
    position,
    isVisible,
    onAnimationComplete
}) => {
    const [animationPhase, setAnimationPhase] = useState<'appearing' | 'visible' | 'fading'>('appearing');

    useEffect(() => {
        if (!isVisible) {
            setAnimationPhase('appearing');
            return;
        }

        // Animation sequence: appearing -> visible -> fading -> complete
        const timer1 = setTimeout(() => setAnimationPhase('visible'), 200);
        const timer2 = setTimeout(() => setAnimationPhase('fading'), 2000);
        const timer3 = setTimeout(() => {
            onAnimationComplete?.();
        }, 3000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [isVisible, onAnimationComplete]);

    if (!isVisible) return null;

    // Position the overlay slightly above the dice
    const overlayPosition: [number, number, number] = [
        position[0],
        position[1] + 2, // Float 2 units above the dice
        position[2]
    ];

    return (
        <Html
            position={overlayPosition}
            center
            distanceFactor={8}
            style={{ pointerEvents: 'none' }} // Don't interfere with dice interactions
        >
            <div
                className={`
          bg-yellow-400 text-black px-3 py-2 rounded-lg font-bold text-xl
          shadow-lg border-2 border-yellow-600 transition-all duration-300
          select-none pointer-events-none
          ${animationPhase === 'appearing' ? 'scale-0 opacity-0 transform translate-y-2' : ''}
          ${animationPhase === 'visible' ? 'scale-110 opacity-100 transform translate-y-0' : ''}
          ${animationPhase === 'fading' ? 'scale-100 opacity-60 transform translate-y-1' : ''}
        `}
                style={{
                    transformOrigin: 'center bottom',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                    minWidth: '2rem',
                    textAlign: 'center'
                }}
            >
                {result}
            </div>
        </Html>
    );
};

export default DiceResultOverlay; 