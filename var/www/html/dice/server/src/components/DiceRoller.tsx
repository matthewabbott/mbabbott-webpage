import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { REGISTER_USERNAME_MUTATION, GET_ACTIVE_USERS_QUERY, USER_LIST_CHANGED_SUBSCRIPTION } from '../graphql/operations';
import ColorPicker from './ColorPicker';
import { getSessionId } from '../utils/sessionId';

interface User {
    sessionId: string;
    username: string;
    color?: string;
    isActive: boolean;
}

interface DiceRollerProps {
    onQuickRoll?: (command: string) => void;
    hideQuickRollCommands?: boolean;
    showOnlyUserSettings?: boolean;
}

const DiceRoller: React.FC<DiceRollerProps> = ({ onQuickRoll, hideQuickRollCommands = false, showOnlyUserSettings = false }) => {
    const [username, setUsername] = useState('Anonymous');
    const [pendingUsername, setPendingUsername] = useState('');
    const [isUsernameRegistered, setIsUsernameRegistered] = useState(true); // Anonymous is always registered
    const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
    const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [userColor, setUserColor] = useState<string>('#ffffff');
    const [users, setUsers] = useState<User[]>([]);
    const [isLocalDiceExpanded, setIsLocalDiceExpanded] = useState(false);

    const currentSessionId = getSessionId();
    const usernameDebounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Query active users to get current user's data (username and color)
    useQuery<{ activeUsers: User[] }>(GET_ACTIVE_USERS_QUERY, {
        onCompleted: (data) => {
            setUsers(data.activeUsers);
            const currentUser = data.activeUsers.find(user => user.sessionId === currentSessionId);
            if (currentUser) {
                // Sync username
                if (currentUser.username) {
                    setUsername(currentUser.username);
                    setPendingUsername(currentUser.username);
                    setIsUsernameRegistered(true);
                }
                // Sync color
                if (currentUser.color) {
                    setUserColor(currentUser.color);
                }
            }
        }
    });

    // Subscribe to user list changes to keep username and color in sync
    useSubscription<{ userListChanged: User[] }>(USER_LIST_CHANGED_SUBSCRIPTION, {
        onData: ({ data: subscriptionData }) => {
            const updatedUsers = subscriptionData?.data?.userListChanged;
            if (updatedUsers) {
                setUsers(updatedUsers);
                const currentUser = updatedUsers.find(user => user.sessionId === currentSessionId);
                if (currentUser) {
                    // Sync username
                    if (currentUser.username && currentUser.username !== username) {
                        setUsername(currentUser.username);
                        setPendingUsername(currentUser.username);
                        setIsUsernameRegistered(true);
                    }
                    // Sync color
                    if (currentUser.color) {
                        setUserColor(currentUser.color);
                    }
                }
            }
        }
    });

    const [registerUsername, { loading: registerLoading }] = useMutation(REGISTER_USERNAME_MUTATION, {
        onCompleted: (data) => {
            console.log('Username registration completed:', data);
            const { success, username: registeredUsername, message } = data.registerUsername;

            if (success) {
                setUsername(registeredUsername);
                setIsUsernameRegistered(true);
                setRegistrationStatus('success');
            } else {
                setIsUsernameRegistered(false);
                setRegistrationStatus('error');
            }

            setRegistrationMessage(message);
        },
        onError: (apolloError) => {
            console.error('Username registration error:', apolloError);
            setIsUsernameRegistered(false);
            setRegistrationStatus('error');
            setRegistrationMessage('Error registering username. Please try again.');
        }
    });

    const attemptUsernameRegistration = useCallback((usernameToRegister: string) => {
        if (!usernameToRegister || usernameToRegister === '') {
            usernameToRegister = 'Anonymous';
        }

        registerUsername({
            variables: {
                username: usernameToRegister
            }
        });
    }, [registerUsername]);

    useEffect(() => {
        if (usernameDebounceTimer.current) {
            clearTimeout(usernameDebounceTimer.current);
        }

        if (pendingUsername && pendingUsername !== username && pendingUsername !== 'Anonymous') {
            usernameDebounceTimer.current = setTimeout(() => {
                attemptUsernameRegistration(pendingUsername);
            }, 1000);
        }

        return () => {
            if (usernameDebounceTimer.current) {
                clearTimeout(usernameDebounceTimer.current);
            }
        };
    }, [pendingUsername, username, attemptUsernameRegistration]);

    const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let newUsername = event.target.value;

        // Regex: Allow letters, numbers, spaces, and _'. -
        //    Remove anything else
        const allowedCharsRegex = /[^a-zA-Z0-9 _'.-]/g;
        newUsername = newUsername.replace(allowedCharsRegex, '');

        const maxLength = 60;
        if (newUsername.length > maxLength) {
            newUsername = newUsername.slice(0, maxLength);
        }

        setPendingUsername(newUsername);

        // If switching to Anonymous, immediately set
        if (newUsername === 'Anonymous') {
            setUsername('Anonymous');
            setIsUsernameRegistered(true);
            setRegistrationStatus('success');
            setRegistrationMessage('Using Anonymous name.');
        } else {
            // For non-Anonymous, mark as unregistered until confirmed
            setIsUsernameRegistered(false);
        }
    };

    const handleDieButtonClick = (dieType: number) => {
        const command = `/roll 1d${dieType}`;
        if (onQuickRoll) {
            onQuickRoll(command);
        }
    };

    const getRegistrationStatusColor = () => {
        switch (registrationStatus) {
            case 'success': return 'text-green-500';
            case 'error': return 'text-red-500';
            case 'loading': return 'text-yellow-500';
            default: return 'text-brand-text-muted';
        }
    };

    const commonDice = [4, 6, 8, 10, 12, 20];

    return (
        <div className={hideQuickRollCommands ? '' : 'card'}>
            {!hideQuickRollCommands && !showOnlyUserSettings && (
                <h2 className="text-xl font-semibold text-brand-text mb-3">User Settings</h2>
            )}

            {/* Username Input */}
            <div className="mb-3">
                <label htmlFor="username" className="block text-sm font-medium text-brand-text-muted mb-1">
                    Username
                </label>
                <div className="space-y-1">
                    <input
                        type="text"
                        id="username"
                        className={`input-field w-full ${!isUsernameRegistered && username !== 'Anonymous' ? 'border-red-500' : ''}`}
                        placeholder="Enter your name"
                        value={pendingUsername || username}
                        onChange={handleUsernameChange}
                        disabled={registerLoading}
                    />
                    {registrationMessage && (
                        <p className={`text-xs ${getRegistrationStatusColor()}`}>
                            {registrationStatus === 'loading' && <span className="inline-block animate-pulse mr-1">⋯</span>}
                            {registrationMessage}
                        </p>
                    )}
                </div>
            </div>

            {/* Color Picker */}
            <div className={hideQuickRollCommands ? '' : 'mb-4'}>
                <ColorPicker currentColor={userColor} onColorChange={setUserColor} />
            </div>

            {/* Active Players List - Only show when in lobby and not user settings only */}
            {hideQuickRollCommands && !showOnlyUserSettings && (
                <div className="mt-4">
                    <h4 className="text-sm font-medium text-brand-text-muted mb-3">Active Players ({users.length})</h4>
                    <div className="space-y-2">
                        {users.map((user) => (
                            <div key={user.sessionId} className="flex items-center gap-2 p-2 bg-brand-surface rounded">
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
                </div>
            )}

            {/* Quick Roll Commands - Only show when not hidden and not user settings only */}
            {!hideQuickRollCommands && !showOnlyUserSettings && (
                <div className="border-t border-brand-surface pt-3">
                    <button
                        onClick={() => setIsLocalDiceExpanded(!isLocalDiceExpanded)}
                        className="w-full flex items-center justify-between p-2 hover:bg-brand-surface rounded transition-colors"
                        title="Quick roll commands that generate shared dice visible to all players"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-brand-text-muted">Quick Roll Commands</span>
                            <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded border border-blue-500/30">
                                Shared Dice
                            </span>
                        </div>
                        <span className="text-brand-text-muted">
                            {isLocalDiceExpanded ? '▼' : '▶'}
                        </span>
                    </button>

                    {isLocalDiceExpanded && (
                        <div className="mt-3 space-y-3">
                            {/* Professional Notice */}
                            <div className="p-3 bg-blue-900/20 rounded border-l-4 border-blue-500">
                                <div className="flex items-start gap-2">
                                    <span className="text-blue-400 text-sm">🎲</span>
                                    <div className="text-xs text-blue-300">
                                        <strong>Shared Dice Commands:</strong> These buttons generate <code>/roll</code> commands
                                        that create dice visible to all players in the session. Results appear in chat and on the canvas.
                                    </div>
                                </div>
                            </div>

                            {/* Quick Roll Buttons */}
                            <div>
                                <h3 className="text-sm font-medium text-brand-text-muted mb-2">Quick Roll Commands</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {commonDice.map((die) => (
                                        <button
                                            key={die}
                                            className="btn-primary px-3 py-2 text-sm"
                                            onClick={() => handleDieButtonClick(die)}
                                            title={`Roll 1d${die} - creates shared dice visible to all players`}
                                        >
                                            🎲 d{die}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-brand-text-muted mt-2">
                                    💡 These create <code>/roll</code> commands for dice shared with all players
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DiceRoller;
