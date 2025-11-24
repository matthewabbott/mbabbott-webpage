import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { SEND_CHAT_MESSAGE_MUTATION, ROLL_DICE_MUTATION, GET_ACTIVE_USERS_QUERY } from '../graphql/operations';
import { ChatCommandParser } from '../services/ChatCommandParser';
import { getSessionId } from '../utils/sessionId';

interface User {
    sessionId: string;
    username: string;
    color?: string;
    isActive: boolean;
}

export interface ChatInputRef {
    populateCommand: (command: string) => void;
}

interface ChatInputProps {
    hideHeader?: boolean;
    onDiceButtonClick?: () => void;
}

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({ hideHeader = false, onDiceButtonClick }, ref) => {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [commandPreview, setCommandPreview] = useState<string | null>(null);
    const [commandError, setCommandError] = useState<string | null>(null);

    // Add ref for the input element
    const inputRef = useRef<HTMLInputElement>(null);

    const currentSessionId = getSessionId();

    // Get current user info
    const { data: usersData } = useQuery<{ activeUsers: User[] }>(GET_ACTIVE_USERS_QUERY);
    const currentUser = usersData?.activeUsers.find(user => user.sessionId === currentSessionId);
    const currentUsername = currentUser?.username || 'Anonymous';

    // Expose methods to parent components
    useImperativeHandle(ref, () => ({
        populateCommand: (command: string) => {
            setMessage(command);
            // Trigger command parsing for the new message
            handleMessageChange({ target: { value: command } } as React.ChangeEvent<HTMLInputElement>);
        }
    }));

    const [sendChatMessage, { loading: chatLoading, error: chatError }] = useMutation(SEND_CHAT_MESSAGE_MUTATION, {
        onCompleted: () => {
            console.log('Chat message sent successfully');
            setMessage('');
            setIsSubmitting(false);
            setCommandPreview(null);
            setCommandError(null);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 1); // wasn't working without delay
        },
        onError: (apolloError) => {
            console.error('Chat message error:', apolloError);
            setIsSubmitting(false);
        }
    });

    const [rollDice, { loading: rollLoading, error: rollError }] = useMutation(ROLL_DICE_MUTATION, {
        onCompleted: (data) => {
            console.log('Dice roll completed:', data);
            setMessage('');
            setIsSubmitting(false);
            setCommandPreview(null);
            setCommandError(null);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 1);
        },
        onError: (apolloError) => {
            console.error('Dice roll error:', apolloError);
            setIsSubmitting(false);
        }
    });

    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMessage = e.target.value;
        setMessage(newMessage);

        // Parse command and show preview
        if (ChatCommandParser.isCommand(newMessage)) {
            const parsed = ChatCommandParser.parseMessage(newMessage);

            if (parsed.error) {
                setCommandError(parsed.error);
                setCommandPreview(null);
            } else {
                setCommandError(null);

                if (parsed.command === 'roll' || parsed.command === 'r' || parsed.command === 'dice' || parsed.command === 'd') {
                    setCommandPreview(`🎲 Roll ${parsed.diceExpression} as ${currentUsername}`);
                } else if (parsed.command === 'help' || parsed.command === 'h' || parsed.command === '?') {
                    if (parsed.args && parsed.args.length > 0) {
                        setCommandPreview(`❓ Show help for: ${parsed.args[0]}`);
                    } else {
                        setCommandPreview('❓ Show all available commands');
                    }
                } else {
                    setCommandPreview(`⚡ Execute command: /${parsed.command}`);
                }
            }
        } else {
            setCommandPreview(null);
            setCommandError(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedMessage = message.trim();
        if (!trimmedMessage || isSubmitting) return;

        setIsSubmitting(true);

        // Store reference to input for refocusing
        const inputElement = inputRef.current;

        // Check if it's a command
        if (ChatCommandParser.isCommand(trimmedMessage)) {
            const parsed = ChatCommandParser.parseMessage(trimmedMessage);

            if (parsed.error) {
                setCommandError(parsed.error);
                setIsSubmitting(false);
                // Refocus immediately on error
                setTimeout(() => inputElement?.focus(), 10);
                return;
            }

            // Handle roll commands
            if (parsed.command === 'roll' || parsed.command === 'r' || parsed.command === 'dice' || parsed.command === 'd') {
                if (parsed.diceExpression) {
                    rollDice({
                        variables: {
                            expression: parsed.diceExpression
                        }
                    });
                } else {
                    setCommandError('Roll command requires a dice expression');
                    setIsSubmitting(false);
                    // Refocus immediately on error
                    setTimeout(() => inputElement?.focus(), 10);
                }
                return;
            }

            // Handle help commands
            if (parsed.command === 'help' || parsed.command === 'h' || parsed.command === '?') {
                const helpInfo = parsed.args && parsed.args.length > 0
                    ? ChatCommandParser.getHelp(parsed.args[0])
                    : ChatCommandParser.getHelp();

                const helpMessage = ChatCommandParser.formatHelp(helpInfo);

                // Send help as a chat message
                sendChatMessage({
                    variables: {
                        message: helpMessage
                    }
                });
                return;
            }

            // Unknown command - show error
            setCommandError(parsed.error || 'Unknown command');
            setIsSubmitting(false);
            // Refocus immediately on error
            setTimeout(() => inputElement?.focus(), 10);
            return;
        }

        // Regular chat message
        sendChatMessage({
            variables: {
                message: trimmedMessage
            }
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const isLoading = chatLoading || rollLoading || isSubmitting;
    const error = chatError || rollError;

    return (
        <div className="card">
            {!hideHeader && (
                <h3 className="text-lg font-semibold text-brand-text mb-3">Send Message</h3>
            )}

            <form onSubmit={handleSubmit} className="space-y-2">
                <div className="flex space-x-2">
                    <div className="relative flex-grow">
                        <input
                            ref={inputRef}
                            type="text"
                            className={`input-field w-full pr-8 transition-colors ${commandError ? 'border-orange-500 bg-orange-900/10' :
                                error ? 'border-red-500 bg-red-900/10' :
                                    commandPreview ? 'border-blue-500 bg-blue-900/10' : ''
                                }`}
                            placeholder="Chat or /roll"
                            value={message}
                            onChange={handleMessageChange}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            maxLength={1000}
                        />

                        {/* Status Icons - Positioned in top-right corner of input */}
                        <div className="absolute top-1 right-1 flex items-center space-x-1">
                            {/* Command Preview Icon */}
                            {commandPreview && (
                                <div className="relative group">
                                    <div className="text-sm cursor-help">
                                        🎲
                                    </div>
                                    <div className="absolute bottom-6 right-0 bg-brand-surface border border-brand-primary rounded-lg p-3 text-sm text-brand-text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 min-w-48 max-w-80">
                                        <div className="break-words">
                                            <span className="font-medium">Preview:</span> {commandPreview}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Command Error Icon */}
                            {commandError && (
                                <div className="relative group">
                                    <div className="text-sm cursor-help animate-pulse">
                                        ⚠️
                                    </div>
                                    <div className="absolute bottom-6 right-0 bg-orange-900/90 border border-orange-500 rounded-lg p-3 text-sm text-orange-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 min-w-48 max-w-80">
                                        <div className="break-words">
                                            <span className="font-medium">Warning:</span> {commandError}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* GraphQL Error Icon */}
                            {error && (
                                <div className="relative group">
                                    <div className="text-sm cursor-help animate-pulse">
                                        ❌
                                    </div>
                                    <div className="absolute bottom-6 right-0 bg-red-900/90 border border-red-500 rounded-lg p-3 text-sm text-red-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 min-w-48 max-w-80">
                                        <div className="break-words">
                                            <span className="font-medium">Error:</span> {error.message}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Help Icon - only show when no other status and no message */}
                            {!message && !commandPreview && !commandError && !error && (
                                <div className="relative group">
                                    <div className="text-sm cursor-help opacity-60">
                                        💡
                                    </div>
                                    <div className="absolute bottom-6 right-0 bg-brand-surface border border-brand-primary rounded-lg p-3 text-xs text-brand-text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 min-w-48 max-w-80">
                                        <div className="break-words">
                                            Try <code>/roll 2d6</code>, <code>/r d20</code>, or <code>/help</code> for commands
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {onDiceButtonClick && (
                        <button
                            type="button"
                            className="btn-secondary px-3 py-2 text-lg"
                            onClick={onDiceButtonClick}
                            disabled={isLoading}
                            title="Quick dice roll commands"
                        >
                            🎲
                        </button>
                    )}
                    <button
                        type="submit"
                        className="btn-primary px-4 py-2"
                        disabled={isLoading || !message.trim()}
                    >
                        {isLoading ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </form>
        </div>
    );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput; 