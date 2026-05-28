import { useAuthState } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

/**
 * Fetches up to 3 unique, recently used address templates from the
 * current user's rental history. Returns loading state for skeleton UI.
 */
export function usePreviousAddresses() {
    const { accessToken } = useAuthState();

    const addresses = useQuery(
        api.rentals.getUserRecentAddresses,
        accessToken ? { accessToken } : "skip"
    );

    return {
        addresses: addresses ?? [],
        isLoading: addresses === undefined && !!accessToken,
    };
}
