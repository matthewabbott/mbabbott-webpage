import React, { useState } from 'react';

interface LocalSandboxControlsProps {
    onQuickRoll?: (command: string) => void;
}

/**
 * LocalSandboxControls Component
 * Contains local-only controls for experimenting with dice in the canvas
 * These controls generate dice that are visible only to the current user
 */
const LocalSandboxControls: React.FC<LocalSandboxControlsProps> = ({ onQuickRoll }) => {
    const [isQuickRollExpanded, setIsQuickRollExpanded] = useState(true);

    const handleDieButtonClick = (dieType: number) => {
        const command = `/roll 1d${dieType}`;
        if (onQuickRoll) {
            onQuickRoll(command);
        }
    };

    const commonDice = [4, 6, 8, 10, 12, 20];

    return (
        <div className="space-y-4">
            {/* Explanation Header */}
            <div className="p-3 bg-purple-900/20 rounded border-l-4 border-purple-500">
                <div className="flex items-start gap-2">
                    <span className="text-purple-400 text-sm">🛝</span>
                    <div className="text-xs text-purple-300">
                        <strong>Sandbox:</strong> These controls are for experimenting and playing around in your canvas.
                        Use them to generate dice and test physics without affecting other players.
                    </div>
                </div>
            </div>

            {/* Quick Roll Section */}
            <div>
                <button
                    onClick={() => setIsQuickRollExpanded(!isQuickRollExpanded)}
                    className="w-full flex items-center justify-between p-2 hover:bg-brand-surface rounded transition-colors"
                    title="Quick roll commands for local experimentation"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-brand-text-muted">Quick Roll Commands</span>
                        <span className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
                            Local Only
                        </span>
                    </div>
                    <span className="text-brand-text-muted">
                        {isQuickRollExpanded ? '▼' : '▶'}
                    </span>
                </button>

                {isQuickRollExpanded && (
                    <div className="mt-3 space-y-3">
                        {/* Quick Roll Buttons */}
                        <div>
                            <h3 className="text-sm font-medium text-brand-text-muted mb-2">Generate Test Dice</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {commonDice.map((die) => (
                                    <button
                                        key={die}
                                        className="btn-secondary px-3 py-2 text-sm hover:bg-purple-600 transition-colors"
                                        onClick={() => handleDieButtonClick(die)}
                                        title={`Generate a local d${die} for testing physics and experimenting`}
                                    >
                                        🎲 d{die}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-brand-text-muted mt-2">
                                💡 These create local dice for experimenting - only you can see them
                            </p>
                        </div>

                        {/* Future: Additional sandbox controls can go here */}
                        <div className="border-t border-brand-surface pt-3">
                            <h3 className="text-sm font-medium text-brand-text-muted mb-2">Physics Controls</h3>
                            <div className="text-xs text-brand-text-muted">
                                🚧 Additional physics and sandbox controls coming soon...
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocalSandboxControls; 