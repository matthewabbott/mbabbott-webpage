import React, { useState, useCallback } from 'react';
import type { DiceRoll } from '../types/canvas.js';

export interface VirtualDiceProps {
    diceData: DiceRoll;
    isHighlighted?: boolean;
    onExpand?: (diceId: string) => void;
    onCollapse?: (diceId: string) => void;
    className?: string;
}

export interface VirtualDiceOverlayProps {
    diceData: DiceRoll;
    isExpanded: boolean;
    onToggleExpand: () => void;
    position: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Virtual Dice Overlay Component
 * Displays virtual dice information as an overlay on physical dice
 */
export const VirtualDiceOverlay: React.FC<VirtualDiceOverlayProps> = ({
    diceData,
    isExpanded,
    onToggleExpand,
    position = 'top'
}) => {
    const totalResult = diceData.result || 0;
    const virtualRolls = diceData.virtualRolls || [];
    const diceCount = virtualRolls.length;

    // Position classes for overlay placement
    const positionClasses = {
        top: 'bottom-full mb-2',
        bottom: 'top-full mt-2',
        left: 'right-full mr-2',
        right: 'left-full ml-2'
    };

    return (
        <div className={`absolute ${positionClasses[position]} left-1/2 transform -translate-x-1/2 z-10`}>
            {/* Main Virtual Dice Indicator */}
            <div
                className={`
                    bg-gradient-to-br from-purple-600 to-purple-800 
                    text-white rounded-lg shadow-lg border-2 border-purple-400
                    px-3 py-2 cursor-pointer transition-all duration-200
                    hover:from-purple-500 hover:to-purple-700 hover:scale-105
                    ${isExpanded ? 'ring-2 ring-purple-300' : ''}
                `}
                onClick={onToggleExpand}
                title={`Virtual ${diceData.diceType.toUpperCase()}: ${diceCount} dice, total ${totalResult}`}
            >
                {/* Virtual Badge */}
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold bg-purple-400 px-1 rounded">VIRTUAL</span>
                    <span className="text-xs opacity-80">{diceData.diceType.toUpperCase()}</span>
                </div>

                {/* Summary Result */}
                <div className="text-center">
                    <div className="text-2xl font-bold">{totalResult}</div>
                    <div className="text-xs opacity-80">{diceCount} dice</div>
                </div>

                {/* Expand/Collapse Indicator */}
                <div className="text-center mt-1">
                    <span className="text-xs opacity-60">
                        {isExpanded ? '▼ Hide Details' : '▲ Show Details'}
                    </span>
                </div>
            </div>

            {/* Expanded Details Panel */}
            {isExpanded && (
                <div className="mt-2 bg-gray-900 text-white rounded-lg shadow-xl border border-gray-600 p-3 max-w-xs">
                    <div className="text-sm font-semibold mb-2 text-purple-300">
                        Individual Rolls ({diceCount} dice)
                    </div>

                    {/* Roll Results Grid */}
                    <div className="max-h-32 overflow-y-auto">
                        <div className="grid grid-cols-5 gap-1 text-xs">
                            {virtualRolls.map((roll, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-700 text-center py-1 rounded border border-gray-600"
                                    title={`Roll ${index + 1}: ${roll}`}
                                >
                                    {roll}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="mt-3 pt-2 border-t border-gray-600 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="text-gray-400">Total:</span>
                                <span className="ml-1 font-semibold">{totalResult}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Average:</span>
                                <span className="ml-1 font-semibold">
                                    {diceCount > 0 ? (totalResult / diceCount).toFixed(1) : '0'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400">Min:</span>
                                <span className="ml-1 font-semibold">
                                    {virtualRolls.length > 0 ? Math.min(...virtualRolls) : 0}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400">Max:</span>
                                <span className="ml-1 font-semibold">
                                    {virtualRolls.length > 0 ? Math.max(...virtualRolls) : 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Virtual Dice Component
 * Wraps a physical dice with virtual dice overlay and interaction
 */
export const VirtualDice: React.FC<VirtualDiceProps> = ({
    diceData,
    isHighlighted = false,
    onExpand,
    onCollapse,
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggleExpand = useCallback(() => {
        const newExpanded = !isExpanded;
        setIsExpanded(newExpanded);

        if (newExpanded && onExpand) {
            onExpand(diceData.canvasId);
        } else if (!newExpanded && onCollapse) {
            onCollapse(diceData.canvasId);
        }
    }, [isExpanded, diceData.canvasId, onExpand, onCollapse]);

    if (!diceData.isVirtual) {
        console.warn('VirtualDice component used with non-virtual dice data');
        return null;
    }

    return (
        <div className={`relative ${className}`}>
            {/* Virtual Dice Overlay */}
            <VirtualDiceOverlay
                diceData={diceData}
                isExpanded={isExpanded}
                onToggleExpand={handleToggleExpand}
                position="top"
            />

            {/* Visual Effects for Virtual Dice */}
            <div className={`
                absolute inset-0 pointer-events-none rounded-lg
                ${isHighlighted ? 'ring-4 ring-purple-400 ring-opacity-75' : ''}
                ${isExpanded ? 'ring-2 ring-purple-300 ring-opacity-50' : ''}
            `} />

            {/* Glow Effect */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-purple-500 opacity-20 rounded-lg blur-sm animate-pulse" />
            </div>
        </div>
    );
};

/**
 * Virtual Dice Summary Component
 * Shows a compact summary of virtual dice without the physical representation
 */
export interface VirtualDiceSummaryProps {
    diceData: DiceRoll;
    onReroll?: (diceId: string) => void;
    className?: string;
}

export const VirtualDiceSummary: React.FC<VirtualDiceSummaryProps> = ({
    diceData,
    onReroll,
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const totalResult = diceData.result || 0;
    const virtualRolls = diceData.virtualRolls || [];
    const diceCount = virtualRolls.length;

    const handleReroll = useCallback(() => {
        if (onReroll) {
            onReroll(diceData.canvasId);
        }
    }, [diceData.canvasId, onReroll]);

    return (
        <div className={`bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-4 text-white ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-purple-400 px-2 py-1 rounded">VIRTUAL</span>
                    <span className="font-semibold">{diceData.diceType.toUpperCase()}</span>
                </div>
                {onReroll && (
                    <button
                        onClick={handleReroll}
                        className="text-xs bg-purple-500 hover:bg-purple-400 px-2 py-1 rounded transition-colors"
                        title="Reroll virtual dice"
                    >
                        🎲 Reroll
                    </button>
                )}
            </div>

            {/* Main Result */}
            <div className="text-center mb-3">
                <div className="text-4xl font-bold">{totalResult}</div>
                <div className="text-sm opacity-80">{diceCount} dice total</div>
            </div>

            {/* Toggle Details */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-sm bg-purple-700 hover:bg-purple-600 py-2 rounded transition-colors"
            >
                {isExpanded ? '▼ Hide Individual Rolls' : '▲ Show Individual Rolls'}
            </button>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-3 pt-3 border-t border-purple-400">
                    <div className="text-sm font-semibold mb-2">Individual Rolls:</div>
                    <div className="max-h-32 overflow-y-auto">
                        <div className="grid grid-cols-6 gap-1 text-xs">
                            {virtualRolls.map((roll, index) => (
                                <div
                                    key={index}
                                    className="bg-purple-700 text-center py-1 rounded"
                                    title={`Roll ${index + 1}: ${roll}`}
                                >
                                    {roll}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>Average: {diceCount > 0 ? (totalResult / diceCount).toFixed(1) : '0'}</div>
                        <div>Range: {virtualRolls.length > 0 ? `${Math.min(...virtualRolls)}-${Math.max(...virtualRolls)}` : '0-0'}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VirtualDice; 