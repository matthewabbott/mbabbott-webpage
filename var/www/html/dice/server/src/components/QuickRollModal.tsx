import React, { useEffect } from 'react';

interface QuickRollModalProps {
    isOpen: boolean;
    onClose: () => void;
    onQuickRoll: (command: string) => void;
}

/**
 * QuickRollModal Component
 * Modal that displays quick dice roll commands
 * Triggered by the 🎲 button next to the chat input
 */
const QuickRollModal: React.FC<QuickRollModalProps> = ({
    isOpen,
    onClose,
    onQuickRoll
}) => {
    // Handle escape key to close modal
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleDiceRoll = (dieType: number) => {
        const command = `/roll 1d${dieType}`;
        onQuickRoll(command);
        onClose();
    };

    const handleBackdropClick = (event: React.MouseEvent) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const commonDice = [
        { type: 4, emoji: '▲', name: 'D4', color: 'bg-slate-600 hover:bg-slate-500' },
        { type: 6, emoji: '⬜', name: 'D6', color: 'bg-slate-600 hover:bg-slate-500' },
        { type: 8, emoji: '🔸', name: 'D8', color: 'bg-slate-600 hover:bg-slate-500' },
        { type: 10, emoji: '🔟', name: 'D10', color: 'bg-slate-600 hover:bg-slate-500' },
        { type: 12, emoji: '⬡', name: 'D12', color: 'bg-slate-600 hover:bg-slate-500' },
        { type: 20, emoji: '🔴', name: 'D20', color: 'bg-slate-600 hover:bg-slate-500' }
    ];

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-brand-surface rounded-lg shadow-xl border border-white/10 p-6 max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-brand-text flex items-center gap-2">
                        🎲 Quick Roll Commands
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-brand-text-muted hover:text-brand-text transition-colors"
                        title="Close modal (Esc)"
                    >
                        ✕
                    </button>
                </div>

                {/* Info Notice */}
                <div className="p-3 bg-blue-900/20 rounded border-l-4 border-blue-500 mb-4">
                    <div className="flex items-start gap-2">
                        <span className="text-blue-400 text-sm">🎲</span>
                        <div className="text-xs text-blue-300">
                            <strong>Shared Dice Commands:</strong> These buttons generate dice
                            visible to all players in the session.
                        </div>
                    </div>
                </div>

                {/* Dice Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    {commonDice.map((die) => (
                        <button
                            key={die.type}
                            onClick={() => handleDiceRoll(die.type)}
                            className={`
                ${die.color} 
                text-white 
                px-4 
                py-3 
                rounded-lg 
                font-medium 
                transition-colors 
                flex 
                items-center 
                justify-center 
                gap-2
              `}
                            title={`Roll 1d${die.type} - creates shared dice visible to all players`}
                        >
                            <span className="text-lg">{die.emoji}</span>
                            <span>{die.name}</span>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-4 text-center">
                    <p className="text-xs text-brand-text-muted">
                        Press <kbd className="bg-brand-background px-1 rounded">Esc</kbd> to close
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuickRollModal; 