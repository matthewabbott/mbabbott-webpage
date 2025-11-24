import { useEffect, useCallback } from 'react';

export interface HotkeyActions {
    toggleCameraLock: () => void;
    toggleFullScreen: () => void;
    resetCamera: () => void;
}

export interface HotkeyConfig {
    enabled?: boolean;
    showHints?: boolean;
}

/**
 * Check if user is currently typing in an input field
 */
const isInputFocused = (): boolean => {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const tagName = activeElement.tagName.toLowerCase();
    const inputTypes = ['input', 'textarea', 'select'];

    // Check if it's an input element
    if (inputTypes.includes(tagName)) return true;

    // Check if it's a contenteditable element
    if (activeElement.getAttribute('contenteditable') === 'true') return true;

    // Check for specific input types
    if (tagName === 'input') {
        const inputType = (activeElement as HTMLInputElement).type.toLowerCase();
        const textInputTypes = ['text', 'password', 'email', 'search', 'tel', 'url'];
        return textInputTypes.includes(inputType);
    }

    return false;
};

/**
 * Global hotkeys hook for canvas camera and view controls
 * Provides keyboard shortcuts while respecting input field focus
 * Focused on camera/view operations only - dice operations are in local controls
 */
export const useGlobalHotkeys = (
    actions: HotkeyActions,
    config: HotkeyConfig = { enabled: true, showHints: true }
) => {
    const handleKeyPress = useCallback((event: KeyboardEvent) => {
        // Skip if hotkeys are disabled
        if (!config.enabled) return;

        // Skip if user is typing in an input field
        if (isInputFocused()) return;

        // Skip if modifier keys are pressed (except for specific combinations)
        if (event.ctrlKey || event.altKey || event.metaKey) return;

        // Handle hotkeys - Camera and View Controls Only
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                actions.toggleCameraLock();
                showHotkeyFeedback('Camera Lock Toggled', '🔒');
                break;

            case 'KeyF':
                event.preventDefault();
                actions.toggleFullScreen();
                showHotkeyFeedback('Fullscreen Toggled', '⛶');
                break;

            case 'KeyV':
                event.preventDefault();
                actions.resetCamera();
                showHotkeyFeedback('Camera Reset', '📷');
                break;

            case 'Escape':
                // Clear focus from any input elements
                if (isInputFocused()) {
                    (document.activeElement as HTMLElement)?.blur();
                    showHotkeyFeedback('Input Unfocused', '⌨️');
                }
                break;
        }
    }, [actions, config.enabled]);

    // Show visual feedback for hotkey activation
    const showHotkeyFeedback = useCallback((message: string, icon: string) => {
        if (!config.showHints) return;

        // Create temporary feedback element
        const feedback = document.createElement('div');
        feedback.className = `
            fixed top-4 left-1/2 transform -translate-x-1/2 z-50
            bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg
            border border-gray-600 text-sm font-medium
            animate-pulse pointer-events-none
        `;
        feedback.innerHTML = `${icon} ${message}`;

        document.body.appendChild(feedback);

        // Remove after animation
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 1500);
    }, [config.showHints]);

    useEffect(() => {
        if (!config.enabled) return;

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [handleKeyPress, config.enabled]);

    // Return hotkey information for UI hints
    const getHotkeyHints = useCallback(() => {
        return [
            { key: 'Space', action: 'Toggle Camera Lock', icon: '🔒' },
            { key: 'F', action: 'Toggle Fullscreen', icon: '⛶' },
            { key: 'V', action: 'Reset Camera', icon: '📷' },
            { key: 'Esc', action: 'Unfocus Input', icon: '⌨️' },
        ];
    }, []);

    return {
        isInputFocused: isInputFocused(),
        getHotkeyHints,
        showHotkeyFeedback
    };
}; 