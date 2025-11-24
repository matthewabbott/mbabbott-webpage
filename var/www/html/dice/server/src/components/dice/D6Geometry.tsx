import { DiceGeometry } from './DiceGeometry';
import { AnimatedMaterial } from './AnimatedMaterial';
import type { DiceGeometryComponent } from './DiceGeometry';

/**
 * D6 Cube Geometry Component
 * Uses Three.js built-in BoxGeometry for simplicity and performance
 */
export const D6Geometry: DiceGeometryComponent = (props) => {
    return (
        <DiceGeometry {...props}>
            <boxGeometry args={[1, 1, 1]} />
            <AnimatedMaterial
                color={props.color}
                isHovered={props.isHovered}
                isHighlighted={props.isHighlighted}
            />
        </DiceGeometry>
    );
};

D6Geometry.diceType = 'd6'; 