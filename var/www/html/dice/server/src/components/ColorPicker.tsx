import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { SET_USER_COLOR_MUTATION } from '../graphql/operations';
import { PRESET_COLORS } from '../constants/colors';

interface ColorPickerProps {
    currentColor?: string;
    onColorChange?: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ currentColor, onColorChange }) => {
    const [selectedColor, setSelectedColor] = useState(currentColor || PRESET_COLORS[0]);
    const [customColor, setCustomColor] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [colorMessage, setColorMessage] = useState<string | null>(null);
    const [colorStatus, setColorStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const [setUserColor, { loading: colorLoading }] = useMutation(SET_USER_COLOR_MUTATION, {
        onCompleted: (data) => {
            console.log('Color mutation completed:', data);
            const { success, color, message } = data.setUserColor;

            if (success) {
                setSelectedColor(color);
                setColorStatus('success');
                onColorChange?.(color);
            } else {
                setColorStatus('error');
            }

            setColorMessage(message);
        },
        onError: (apolloError) => {
            console.error('Color mutation error:', apolloError);
            setColorStatus('error');
            setColorMessage('Error updating color. Please try again.');
        }
    });

    const validateColor = (color: string): boolean => {
        // Basic hex color validation
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    };

    const handlePresetColorClick = (color: string) => {
        setSelectedColor(color);
        setShowCustomInput(false);
        setCustomColor('');
        handleColorSubmit(color);
    };

    const handleCustomColorSubmit = () => {
        if (!validateColor(customColor)) {
            setColorMessage('Please enter a valid hex color (e.g., #FF0000)');
            setColorStatus('error');
            return;
        }

        setSelectedColor(customColor);
        setShowCustomInput(false);
        handleColorSubmit(customColor);
    };

    const handleColorSubmit = (color: string) => {
        setColorStatus('loading');
        setColorMessage('Updating color...');

        setUserColor({
            variables: { color }
        });
    };

    const getStatusColor = () => {
        switch (colorStatus) {
            case 'success': return 'text-green-500';
            case 'error': return 'text-red-500';
            case 'loading': return 'text-yellow-500';
            default: return 'text-brand-text-muted';
        }
    };

    return (
        <div className="space-y-2">
            {/* Color indicator - click to expand */}
            <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-brand-text-muted">
                    Color:
                </label>
                <button
                    className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    disabled={colorLoading}
                >
                    <div
                        className="w-6 h-6 rounded border-2 border-brand-surface"
                        style={{ backgroundColor: selectedColor }}
                        title={`Current color: ${selectedColor} (click to change)`}
                    />
                    <span className="text-xs text-brand-text-muted">
                        {showColorPicker ? '▼' : '▶'}
                    </span>
                </button>
            </div>

            {/* Expanded color picker */}
            {showColorPicker && (
                <div className="space-y-3 pl-4 border-l-2 border-brand-surface">
                    {/* Preset Colors */}
                    <div className="grid grid-cols-6 gap-1">
                        {PRESET_COLORS.map((color) => (
                            <button
                                key={color}
                                className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${selectedColor === color ? 'border-brand-text' : 'border-brand-surface'
                                    }`}
                                style={{ backgroundColor: color }}
                                onClick={() => handlePresetColorClick(color)}
                                disabled={colorLoading}
                                title={`Select color ${color}`}
                                aria-label={`Select color ${color}`}
                            />
                        ))}
                    </div>

                    {/* Custom Color Toggle */}
                    <button
                        className="text-sm text-brand-text-muted hover:text-brand-text underline"
                        onClick={() => setShowCustomInput(!showCustomInput)}
                        disabled={colorLoading}
                    >
                        {showCustomInput ? 'Hide custom color' : 'Use custom color'}
                    </button>

                    {/* Custom Color Input */}
                    {showCustomInput && (
                        <div className="space-y-2">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    className="input-field flex-grow text-sm"
                                    placeholder="#FF0000"
                                    value={customColor}
                                    onChange={(e) => setCustomColor(e.target.value.toUpperCase())}
                                    disabled={colorLoading}
                                />
                                <button
                                    className="btn-secondary px-3 py-1 text-sm"
                                    onClick={handleCustomColorSubmit}
                                    disabled={colorLoading || !customColor}
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Status Message */}
                    {colorMessage && (
                        <p className={`text-xs ${getStatusColor()}`}>
                            {colorStatus === 'loading' && <span className="inline-block animate-pulse mr-1">⋯</span>}
                            {colorMessage}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ColorPicker; 