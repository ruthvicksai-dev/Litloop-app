import NetInfo from "@react-native-community/netinfo";
import { useContext } from "react";
import { NetworkContext } from "../context/NetworkContext";

/**
 * Hook to strictly get current network status from global context.
 */
export function useNetworkStatus() {
    return useContext(NetworkContext);
}

/**
 * Wrapper utility to execute a function only if online.
 * Throws a controlled error if offline, to be caught by UI or try/catch.
 */
export async function withNetworkRequirement<T>(
    action: () => Promise<T>,
    customOfflineMessage?: string
): Promise<T> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
        throw new Error(customOfflineMessage || "No Internet Connection. Please check your network and try again.");
    }
    return action();
}
