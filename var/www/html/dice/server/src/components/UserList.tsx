import React, { useState } from 'react';
import { useQuery, useSubscription } from '@apollo/client';
import { GET_ACTIVE_USERS_QUERY, USER_LIST_CHANGED_SUBSCRIPTION } from '../graphql/operations';

interface User {
    sessionId: string;
    username: string;
    color?: string;
    isActive: boolean;
}

const UserList: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);

    const { loading: queryLoading, error: queryError } = useQuery<{ activeUsers: User[] }>(
        GET_ACTIVE_USERS_QUERY,
        {
            onCompleted: (data) => {
                console.log('Initial active users loaded:', data.activeUsers);
                setUsers(data.activeUsers);
            },
            onError: (err) => {
                console.error('Error loading active users:', err);
            }
        }
    );

    const { loading: subscriptionLoading, error: subscriptionError } = useSubscription<{ userListChanged: User[] }>(
        USER_LIST_CHANGED_SUBSCRIPTION,
        {
            onData: ({ data: subscriptionData }) => {
                const updatedUsers = subscriptionData?.data?.userListChanged;
                if (updatedUsers) {
                    console.log('User list updated via subscription:', updatedUsers);
                    setUsers(updatedUsers);
                } else {
                    console.log('Subscription data received, but no userListChanged field:', subscriptionData?.data);
                }
            },
            onError: (err) => {
                console.error('Error in user list subscription:', err);
            }
        }
    );

    if (queryLoading) console.log('Loading initial users...');
    if (subscriptionLoading) console.log('User list subscription loading...');
    if (queryError) console.error('Query error:', queryError);
    if (subscriptionError) console.error('Subscription error:', subscriptionError);

    return (
        <div className="card">
            <h2 className="text-xl font-semibold text-brand-text mb-3">
                Online Users ({users.length})
            </h2>

            {queryLoading && (
                <div className="text-center text-brand-text-muted">
                    <span className="inline-block animate-pulse">Loading users...</span>
                </div>
            )}

            {queryError && (
                <div className="text-center text-red-500 text-sm">
                    Error loading users: {queryError.message}
                </div>
            )}

            <ul className="space-y-1 text-brand-text-muted max-h-48 overflow-y-auto">
                {users.map((user) => (
                    <li key={user.sessionId} className="flex items-center space-x-2 p-1">
                        {/* Online indicator */}
                        <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />

                        {/* Username */}
                        <span
                            className="text-brand-text truncate font-medium"
                            style={{ color: user.color || '#ffffff' }}
                        >
                            {user.username}
                        </span>
                    </li>
                ))}

                {!queryLoading && users.length === 0 && (
                    <li className="text-center text-brand-text-muted py-2">
                        No users online
                    </li>
                )}
            </ul>

            {subscriptionError && (
                <div className="text-red-500 text-xs mt-2">
                    Connection issue: {subscriptionError.message}
                </div>
            )}
        </div>
    );
};

export default UserList; 