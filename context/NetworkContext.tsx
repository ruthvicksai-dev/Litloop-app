import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import React, { createContext, useEffect, useState } from "react";

interface NetworkContextType {
    isOnline: boolean;
    isInternetReachable: boolean | null;
}

export const NetworkContext = createContext<NetworkContextType>({
    isOnline: true,
    isInternetReachable: true,
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
    const [networkState, setNetworkState] = useState<NetworkContextType>({
        isOnline: true,
        isInternetReachable: true,
    });

    useEffect(() => {
        // Subscribe to network state updates
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            const isOnline = state.isConnected ?? false;
            setNetworkState({
                isOnline,
                isInternetReachable: state.isInternetReachable,
            });
        });

        // Fetch initial state
        NetInfo.fetch().then((state) => {
            setNetworkState({
                isOnline: state.isConnected ?? false,
                isInternetReachable: state.isInternetReachable,
            });
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <NetworkContext.Provider value={networkState}>
            {children}
        </NetworkContext.Provider>
    );
}
