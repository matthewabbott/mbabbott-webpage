import React, { useRef, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useQuery, useSubscription } from '@apollo/client';
import { GET_ACTIVE_USERS_QUERY, USER_LIST_CHANGED_SUBSCRIPTION } from '../graphql/operations';
import Header from './Header';
import DiceRoller from './DiceRoller';
import ActivityFeed from './ActivityFeed';
import type { ChatInputRef } from './ChatInput';
import DiceCanvas from './DiceCanvas';
import TranslucentSidebar from './TranslucentSidebar';
import UnifiedBottomControls from './UnifiedBottomControls';

import { useCameraControls } from '../hooks/controls/useCameraControls';

const Layout: React.FC = () => {
    const chatInputRef = useRef<ChatInputRef>(null);

    // Camera controls managed at Layout level for sharing between components
    const [cameraState, cameraOperations, controlsRef] = useCameraControls();

    const handleQuickRoll = (command: string) => {
        if (chatInputRef.current) {
            chatInputRef.current.populateCommand(command);
        }
    };

    return (
        <div className="min-h-screen bg-brand-background text-brand-text flex flex-col">
            <Header />
            <main className="flex-grow h-0 relative">
                {/* Full-screen Canvas Background */}
                <div className="absolute inset-0">
                    <DiceCanvas
                        cameraState={cameraState}
                        cameraOperations={cameraOperations}
                        controlsRef={controlsRef}
                    />
                </div>

                {/* Resizable Panel Overlay System */}
                <div className="h-full relative z-10" style={{ pointerEvents: 'none' }}>
                    <PanelGroup
                        direction="horizontal"
                        autoSaveId="dice-roller-layout"
                        className="h-full"
                    >
                        {/* Left Sidebar - Activity Feed (Translucent Overlay) */}
                        <Panel
                            id="activity-feed"
                            defaultSize={25}
                            minSize={20}
                            maxSize={40}
                            order={1}
                        >
                            <TranslucentSidebar side="left" className="p-4">
                                <ActivityFeed onQuickRoll={handleQuickRoll} chatInputRef={chatInputRef} />
                            </TranslucentSidebar>
                        </Panel>

                        <PanelResizeHandle
                            className="w-1 bg-white/20 hover:bg-white/40 transition-colors relative z-20"
                            style={{ pointerEvents: 'auto' }}
                        />

                        {/* Center - Transparent spacer to allow canvas to show through */}
                        <Panel id="canvas-spacer" order={2}>
                            <div className="h-full relative" style={{ pointerEvents: 'none' }}>
                                {/* Unified Bottom Controls - Dice + Camera */}
                                <div className="absolute bottom-0 left-0 right-0" style={{ pointerEvents: 'auto' }}>
                                    <UnifiedBottomControls
                                        onQuickRoll={handleQuickRoll}
                                        isCameraLocked={cameraState.isCameraLocked}
                                        onToggleCameraLock={cameraOperations.toggleCameraLock}
                                        onResetCamera={cameraOperations.resetCamera}
                                        onToggleFullScreen={cameraOperations.toggleFullScreen}
                                    />
                                </div>
                            </div>
                        </Panel>

                        <PanelResizeHandle
                            className="w-1 bg-white/20 hover:bg-white/40 transition-colors relative z-20"
                            style={{ pointerEvents: 'auto' }}
                        />

                        {/* Right Sidebar - Lobby (Translucent Overlay) */}
                        <Panel
                            id="lobby"
                            defaultSize={25}
                            minSize={20}
                            maxSize={40}
                            order={3}
                        >
                            <TranslucentSidebar side="right" className="p-4">
                                <LobbyPanel />
                            </TranslucentSidebar>
                        </Panel>
                    </PanelGroup>
                </div>
            </main>
        </div>
    );
};

// Consolidated Lobby Panel Component
const LobbyPanel: React.FC = () => {
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(() => {
        // Load from localStorage, default to true
        const saved = localStorage.getItem('dice-roller-auto-scroll');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const handleAutoScrollChange = (enabled: boolean) => {
        setAutoScrollEnabled(enabled);
        localStorage.setItem('dice-roller-auto-scroll', JSON.stringify(enabled));
        // Dispatch custom event to notify ActivityFeed
        window.dispatchEvent(new CustomEvent('autoScrollChanged', { detail: enabled }));
    };

    return (
        <div className="h-full p-4 space-y-4 overflow-y-auto">
            {/* Room Info */}
            <div className="bg-brand-surface/50 rounded-lg p-3 border border-white/10">
                <h3 className="text-sm font-medium text-brand-text mb-2 flex items-center gap-2">
                    🏠 Room Information
                </h3>
                <div className="space-y-1 text-xs text-brand-text-muted">
                    <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="text-green-400">🟢 Connected</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Room ID:</span>
                        <span className="font-mono">dice-lobby</span>
                    </div>
                </div>
            </div>

            {/* Active Players */}
            <div className="bg-brand-surface/50 rounded-lg p-3 border border-white/10">
                <h4 className="text-sm font-medium text-brand-text mb-3 flex items-center gap-2">
                    👥 Active Players
                </h4>
                <ActivePlayersSection />
            </div>

            {/* User Settings */}
            <div className="bg-brand-surface/50 rounded-lg p-3 border border-white/10">
                <h3 className="text-sm font-medium text-brand-text mb-3 flex items-center gap-2">
                    👤 User Profile
                </h3>
                <DiceRoller onQuickRoll={() => { }} hideQuickRollCommands={true} showOnlyUserSettings={true} />
            </div>

            {/* Preferences */}
            <div className="bg-brand-surface/50 rounded-lg p-3 border border-white/10">
                <h4 className="text-sm font-medium text-brand-text mb-3 flex items-center gap-2">
                    ⚙️ Preferences
                </h4>
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            className="rounded border-gray-600 bg-brand-background text-brand-primary focus:ring-brand-primary focus:ring-offset-0"
                            checked={autoScrollEnabled}
                            onChange={(e) => handleAutoScrollChange(e.target.checked)}
                        />
                        <span className="text-brand-text-muted">Auto-scroll chat to bottom</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

// Active Players Section Component - Only shows players list without username/color customization
interface User {
    sessionId: string;
    username: string;
    color?: string;
    isActive: boolean;
}

const ActivePlayersSection: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);

    useQuery<{ activeUsers: User[] }>(GET_ACTIVE_USERS_QUERY, {
        onCompleted: (data) => {
            setUsers(data.activeUsers);
        }
    });

    useSubscription<{ userListChanged: User[] }>(USER_LIST_CHANGED_SUBSCRIPTION, {
        onData: ({ data: subscriptionData }) => {
            const updatedUsers = subscriptionData?.data?.userListChanged;
            if (updatedUsers) {
                setUsers(updatedUsers);
            }
        }
    });

    return (
        <div className="space-y-2">
            <div className="text-xs text-brand-text-muted mb-2">
                {users.length} player{users.length !== 1 ? 's' : ''} connected
            </div>
            {users.map((user) => (
                <div key={user.sessionId} className="flex items-center gap-2 p-2 bg-brand-background/50 rounded">
                    <div
                        className="w-3 h-3 rounded-full border border-gray-400"
                        style={{ backgroundColor: user.color || '#ffffff' }}
                        title={`${user.username}'s color`}
                    />
                    <span className="text-brand-text text-sm">{user.username}</span>
                    {user.isActive && (
                        <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">
                            Online
                        </span>
                    )}
                </div>
            ))}
            {users.length === 0 && (
                <div className="text-center text-brand-text-muted text-sm py-4">
                    No players connected
                </div>
            )}
        </div>
    );
};

export default Layout;
