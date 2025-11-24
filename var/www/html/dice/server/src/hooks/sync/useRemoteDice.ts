import { useState, useRef, useEffect } from 'react';
import { DiceD4, DiceD6, DiceD8, DiceD10, DiceD12, DiceD20 } from '../../physics';
import { RemoteDiceService, type RemoteDiceOperations } from '../../services/canvas/RemoteDiceService';

type DiceInstance = DiceD4 | DiceD6 | DiceD8 | DiceD10 | DiceD12 | DiceD20;

export interface UseRemoteDiceProps {
    isInitialized: boolean;
}



/**
 * Custom hook for managing remote dice state and operations
 * Extracted from DiceCanvas for better separation of concerns
 */
export const useRemoteDice = ({ isInitialized }: UseRemoteDiceProps): [
    Map<string, DiceInstance>,
    RemoteDiceOperations
] => {
    const remoteDiceServiceRef = useRef<RemoteDiceService | null>(null);
    const [remoteDice, setRemoteDice] = useState<Map<string, DiceInstance>>(new Map());

    // Initialize the remote dice service
    useEffect(() => {
        if (!remoteDiceServiceRef.current) {
            remoteDiceServiceRef.current = new RemoteDiceService();
        }

        if (isInitialized && remoteDiceServiceRef.current) {
            remoteDiceServiceRef.current.initialize();
        }
    }, [isInitialized]);

    // Update local state when remote dice instances change
    useEffect(() => {
        if (remoteDiceServiceRef.current) {
            const updateRemoteDice = () => {
                const instances = remoteDiceServiceRef.current!.getAllRemoteDiceInstances();
                setRemoteDice(instances);
            };

            // Subscribe to updates
            remoteDiceServiceRef.current.onUpdate(updateRemoteDice);

            // Cleanup subscription on unmount
            return () => {
                if (remoteDiceServiceRef.current) {
                    remoteDiceServiceRef.current.offUpdate(updateRemoteDice);
                }
            };
        }
    }, []);

    // Get operations from the service
    const operations: RemoteDiceOperations = remoteDiceServiceRef.current?.getOperations() || {
        spawnRemoteDice: async () => { },
        applyRemoteDiceThrow: () => { },
        applyRemoteDiceSettle: () => { },
        applyRemoteDiceHighlight: () => { },
        removeRemoteDice: () => { },
        clearRemoteDice: () => { }
    };

    return [remoteDice, operations];
}; 