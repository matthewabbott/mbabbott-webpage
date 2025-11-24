// Import all components first
import { DiceGeometry, calculateNormals, generateBasicUVs } from './DiceGeometry';
import { D4Geometry } from './D4Geometry';
import { D6Geometry } from './D6Geometry';
import { D8Geometry } from './D8Geometry';
import { D10Geometry } from './D10Geometry';
import { D12Geometry } from './D12Geometry';
import { D20Geometry } from './D20Geometry';

// Re-export everything
export { DiceGeometry, calculateNormals, generateBasicUVs };
export type { DiceGeometryProps, DiceGeometryComponent } from './DiceGeometry';

export { D4Geometry, D6Geometry, D8Geometry, D10Geometry, D12Geometry, D20Geometry };

// Dice geometry registry for easy lookup
export const DICE_GEOMETRIES = {
    d4: D4Geometry,
    d6: D6Geometry,
    d8: D8Geometry,
    d10: D10Geometry,
    d12: D12Geometry,
    d20: D20Geometry,
} as const;

export type DiceType = keyof typeof DICE_GEOMETRIES; 