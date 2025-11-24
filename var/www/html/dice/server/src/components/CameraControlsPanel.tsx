import React from 'react';

interface CameraControlsPanelProps {
    isCameraLocked: boolean;
    onToggleCameraLock: () => void;
    onResetCamera: () => void;
    onToggleFullScreen: () => void;
    isPeeking?: boolean;
}

/**
 * CameraControlsPanel Component
 * Contains camera controls and help information for the bottom expandable panel
 * Consolidates camera lock, reset, fullscreen, and help instructions
 * Supports both full expanded view and condensed peek view
 */
const CameraControlsPanel: React.FC<CameraControlsPanelProps> = ({
    isCameraLocked,
    onToggleCameraLock,
    onResetCamera,
    onToggleFullScreen,
    isPeeking = false
}) => {

    // Show condensed view when peeking
    if (isPeeking) {
        return (
            <div className="space-y-3">
                {/* Quick Camera Actions - Condensed */}
                <div>
                    <h3 className="text-sm font-medium text-brand-text-muted mb-2">Quick Camera Controls</h3>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={onToggleCameraLock}
                            className={`${isCameraLocked
                                ? 'bg-red-600 hover:bg-red-500'
                                : 'bg-green-600 hover:bg-green-500'
                                } text-white font-medium py-1.5 px-2 rounded transition-colors text-xs`}
                            title={isCameraLocked ? "Unlock camera - Space" : "Lock camera - Space"}
                        >
                            {isCameraLocked ? '🔒' : '🔓'}
                        </button>

                        <button
                            onClick={onResetCamera}
                            className="bg-gray-600 hover:bg-gray-500 text-white font-medium py-1.5 px-2 rounded transition-colors text-xs"
                            title="Reset camera - V"
                        >
                            📷
                        </button>

                        <button
                            onClick={onToggleFullScreen}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-1.5 px-2 rounded transition-colors text-xs"
                            title="Fullscreen - F"
                        >
                            ⛶
                        </button>
                    </div>
                </div>

                {/* Quick Hotkeys Reference */}
                <div className="p-2 bg-blue-900/20 rounded border-l-2 border-blue-500">
                    <div className="text-xs text-blue-300">
                        <strong>Quick Keys:</strong> Space (lock) • V (reset) • F (fullscreen) • Esc (unfocus)
                    </div>
                </div>
            </div>
        );
    }

    // Full expanded view
    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Left Column - Instructions */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-brand-text-muted">Instructions</span>
                    <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded border border-blue-500/30">
                        Hotkeys
                    </span>
                </div>

                <div className="space-y-3">
                    <div>
                        <h4 className="text-xs font-medium text-brand-text-muted mb-1">Camera Navigation</h4>
                        <div className="text-xs space-y-1 text-brand-text-muted">
                            <div>• <strong>Left Click & Drag:</strong> Rotate view</div>
                            <div>• <strong>Right Click & Drag:</strong> Pan camera</div>
                            <div>• <strong>Mouse Wheel:</strong> Zoom in/out</div>
                            <div>• <strong>Shift + Click & Drag dice:</strong> Throw dice</div>
                        </div>
                    </div>

                    <div className="border-t border-brand-surface pt-2">
                        <h4 className="text-xs font-medium text-brand-text-muted mb-1">Keyboard Shortcuts</h4>
                        <div className="text-xs space-y-1 text-brand-text-muted">
                            <div>• <strong>Space:</strong> Toggle camera lock</div>
                            <div>• <strong>V:</strong> Reset camera view</div>
                            <div>• <strong>F:</strong> Toggle fullscreen</div>
                            <div>• <strong>Esc:</strong> Unfocus input fields</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column - Controls */}
            <div>
                <h3 className="text-sm font-medium text-brand-text-muted mb-3">Camera Controls</h3>

                {/* Camera Status Info */}
                <div className="p-2 bg-blue-900/20 rounded border-l-2 border-blue-500 mb-3">
                    <div className="text-xs text-blue-300">
                        <strong>Status:</strong> {isCameraLocked
                            ? "Locked - Click dice freely"
                            : "Free - Mouse controls view"
                        }
                    </div>
                </div>

                {/* Tip */}
                <div className="text-xs text-brand-text-muted mb-3">
                    💡 Lock the camera when you want to interact with dice without accidentally moving the view
                </div>

                {/* Control Buttons */}
                <div className="space-y-2">
                    <button
                        onClick={onToggleCameraLock}
                        className={`w-full ${isCameraLocked
                            ? 'bg-red-600 hover:bg-red-500'
                            : 'bg-green-600 hover:bg-green-500'
                            } text-white font-medium py-2 px-3 rounded transition-colors text-sm`}
                        title={isCameraLocked ? "Unlock camera (enable rotation/pan) - Hotkey: Space" : "Lock camera (disable rotation/pan) - Hotkey: Space"}
                    >
                        {isCameraLocked ? '🔒 Locked' : '🔓 Free'}
                        <span className="ml-1 opacity-60 text-xs">(Space)</span>
                    </button>

                    <button
                        onClick={onResetCamera}
                        className="w-full bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 px-3 rounded transition-colors text-sm"
                        title="Reset camera view - Hotkey: V"
                    >
                        📷 Reset
                        <span className="ml-1 opacity-60 text-xs">(V)</span>
                    </button>

                    <button
                        onClick={onToggleFullScreen}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-3 rounded transition-colors text-sm"
                        title="Toggle fullscreen mode - Hotkey: F"
                    >
                        ⛶ Fullscreen
                        <span className="ml-1 opacity-60 text-xs">(F)</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CameraControlsPanel; 