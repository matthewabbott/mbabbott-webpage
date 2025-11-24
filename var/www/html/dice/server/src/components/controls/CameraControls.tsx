import React from 'react';

export interface CameraControlsProps {
    isCameraLocked: boolean;
    onToggleCameraLock: () => void;
    onResetCamera: () => void;
}

/**
 * CameraControls Component
 * Provides camera lock and reset controls
 * Extracted from DiceCanvas for better separation of concerns
 */
export const CameraControls: React.FC<CameraControlsProps> = ({
    isCameraLocked,
    onToggleCameraLock,
    onResetCamera
}) => {
    return (
        <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-sm font-medium mb-2">Camera Controls:</div>
            <div className="flex gap-2">
                <button
                    onClick={onToggleCameraLock}
                    className={`flex-1 ${isCameraLocked ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} text-white font-semibold py-2 px-3 rounded transition-colors`}
                    title={isCameraLocked ? "Unlock camera (enable rotation/pan)" : "Lock camera (disable rotation/pan)"}
                >
                    {isCameraLocked ? '🔒 Camera Locked' : '🔓 Camera Free'}
                </button>
                <button
                    onClick={onResetCamera}
                    className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded transition-colors"
                    title="Reset camera view"
                >
                    📷 Reset View
                </button>
            </div>
            <div className="text-xs text-gray-400 mt-2">
                {isCameraLocked ?
                    "Camera is locked. Click dice freely without moving the camera." :
                    "Camera is free. Use mouse to rotate/pan view."
                }
            </div>
        </div>
    );
}; 