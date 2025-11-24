import React, { useState } from 'react';

interface DiceControlsPanelProps {
    onQuickRoll?: (command: string) => void;
    isPeeking?: boolean;
}

/**
 * DiceControlsPanel Component
 * Contains dice roll controls with quantity selection
 * Moved from QuickRollModal to provide better integration
 */
const DiceControlsPanel: React.FC<DiceControlsPanelProps> = ({
    onQuickRoll,
    isPeeking = false
}) => {
    const [quantity, setQuantity] = useState(1);
    const [inputValue, setInputValue] = useState('1'); // Track input display value separately

    const commonDice = [
        { type: 4, emoji: '▲', name: 'D4', color: 'bg-slate-600 hover:bg-slate-500' },
        { type: 6, emoji: '⬜', name: 'D6', color: 'bg-slate-600 hover:bg-slate-500' },
        { type: 8, emoji: '🔸', name: 'D8', color: 'bg-slate-600 hover:bg-slate-500' },
        { type: 10, emoji: '🔟', name: 'D10', color: 'bg-slate-600 hover:bg-slate-500' },
        { type: 12, emoji: '⬡', name: 'D12', color: 'bg-slate-600 hover:bg-slate-500' },
        { type: 20, emoji: '🔴', name: 'D20', color: 'bg-slate-600 hover:bg-slate-500' }
    ];

    const validateAndSetQuantity = (newQuantity: number) => {
        // Cap at 1000 for UI (system supports up to 10,000 but 1000 is reasonable for UI)
        const clampedQuantity = Math.max(1, Math.min(1000, newQuantity));
        setQuantity(clampedQuantity);
        setInputValue(clampedQuantity.toString());
        return clampedQuantity;
    };

    const handleQuantityChange = (newQuantity: number) => {
        validateAndSetQuantity(newQuantity);
    };

    const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value); // Allow any input for now

        // Only update quantity if it's a valid number
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue > 0) {
            setQuantity(Math.max(1, Math.min(1000, numValue)));
        }
    };

    const handleQuantityInputBlur = () => {
        // Validate and fix on blur
        const numValue = parseInt(inputValue);
        if (isNaN(numValue) || numValue < 1) {
            validateAndSetQuantity(1);
        } else {
            validateAndSetQuantity(numValue);
        }
    };

    const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow only numeric input, backspace, delete, arrow keys, tab, enter
        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
            e.preventDefault();
        }

        // Handle enter key
        if (e.key === 'Enter') {
            e.currentTarget.blur(); // Trigger validation
        }
    };

    const handleDiceRoll = (dieType: number) => {
        const command = `/roll ${quantity}d${dieType}`;
        if (onQuickRoll) {
            onQuickRoll(command);
        }
    };

    // Show condensed view when peeking
    if (isPeeking) {
        return (
            <div>
                {/* Quick Dice Buttons - Condensed */}
                <div>
                    <h3 className="text-sm font-medium text-brand-text-muted mb-2">Quick Dice Rolls</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {commonDice.slice(0, 6).map((die) => (
                            <button
                                key={die.type}
                                className={`${die.color} text-white font-medium py-1.5 px-2 rounded transition-colors text-xs flex items-center justify-center gap-1`}
                                onClick={() => handleDiceRoll(die.type)}
                                title={`Roll ${quantity}d${die.type}`}
                            >
                                <span className="text-xs">{die.emoji}</span>
                                <span>{quantity}d{die.type}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Full expanded view
    return (
        <div className="space-y-4">
            {/* Explanation Header */}
            <div className="p-3 bg-blue-900/20 rounded border-l-4 border-blue-500">
                <div className="flex items-start gap-2">
                    <span className="text-blue-400 text-sm">🎲</span>
                    <div className="text-xs text-blue-300">
                        <strong>Shared Dice Commands:</strong> These controls generate <code>/roll</code> commands
                        that create dice visible to all players in the session. Results appear in chat and on the canvas.
                        Shift + Click & Drag to pick up and throw dice yourself! (Purely cosmetic, does not propagate to other players)
                    </div>
                </div>
            </div>

            {/* Main Controls Layout */}
            <div className="grid grid-cols-3 gap-4">
                {/* Quantity Selector - 1/3 width */}
                <div className="bg-brand-background/50 rounded-lg p-3 border border-white/10">
                    <div className="text-center">
                        <span className="text-sm font-medium text-brand-text block mb-2">Number of Dice</span>
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => handleQuantityChange(quantity - 1)}
                                className="w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm flex items-center justify-center font-bold"
                                disabled={quantity <= 1}
                            >
                                −
                            </button>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={handleQuantityInputChange}
                                onBlur={handleQuantityInputBlur}
                                onKeyDown={handleQuantityKeyDown}
                                className="w-12 text-center text-lg font-bold text-brand-text bg-brand-surface rounded px-2 py-1 border border-white/20 focus:border-blue-400 focus:outline-none"
                                title="Enter 1-1000 dice (large rolls use virtual dice)"
                            />
                            <button
                                onClick={() => handleQuantityChange(quantity + 1)}
                                className="w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm flex items-center justify-center font-bold"
                                disabled={quantity >= 1000}
                            >
                                +
                            </button>
                        </div>
                        <div className="text-xs text-brand-text-muted mt-1">
                            {quantity > 10 ? 'Virtual dice' : 'Physical dice'}
                        </div>
                    </div>
                </div>

                {/* Dice Controls Grid - 2/3 width */}
                <div className="col-span-2">
                    <h3 className="text-sm font-medium text-brand-text-muted mb-3">Dice Types</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {commonDice.map((die) => (
                            <button
                                key={die.type}
                                onClick={() => handleDiceRoll(die.type)}
                                className={`
                                    ${die.color} 
                                    text-white 
                                    px-2 
                                    py-2 
                                    rounded 
                                    font-medium 
                                    transition-colors 
                                    flex 
                                    items-center 
                                    justify-center 
                                    gap-1
                                    text-sm
                                `}
                                title={`Roll ${quantity}d${die.type} - creates shared dice visible to all players`}
                            >
                                <span className="text-sm">{die.emoji}</span>
                                <span>{die.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiceControlsPanel; 