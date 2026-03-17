import { useAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

export function useReadLater() {
    const { accessToken } = useAuth();

    // 1. Fetch user's read later book IDs
    const readLaterIds =
        useQuery(
            api.readLater.getUserReadLaterIds,
            accessToken ? { accessToken } : "skip"
        ) ?? [];

    // 2. The mutation to toggle
    const toggleMut = useMutation(api.readLater.toggleReadLater);

    // 3. Helper to check if a specific book is in read later
    const isReadLater = (bookId: string) => {
        return readLaterIds.includes(bookId as Id<"books">);
    };

    // 4. Wrapped toggle function for easy UI usage
    const toggleReadLater = async (bookId: string) => {
        try {
            if (!accessToken) {
                console.warn("Must be signed in to add books to read later.");
                return;
            }
            await toggleMut({ accessToken, bookId: bookId as Id<"books"> });
        } catch (error) {
            console.error("Failed to toggle read later:", error);
        }
    };

    return {
        readLaterIds,
        isReadLater,
        toggleReadLater,
    };
}
