import { useAuthState } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

type ToggleReadLaterOptions = {
    showFeedback?: boolean;
};

export function useReadLater() {
    const { accessToken } = useAuthState();
    const { showToast } = useToast();

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
    const toggleReadLater = async (
        bookId: string,
        options: ToggleReadLaterOptions = {}
    ) => {
        const { showFeedback = true } = options;
        const wasSaved = isReadLater(bookId);

        try {
            if (!accessToken) {
                if (showFeedback) {
                    showToast("Sign in to save books for later.", "info");
                }
                return false;
            }

            await toggleMut({ accessToken, bookId: bookId as Id<"books"> });

            if (showFeedback) {
                showToast(
                    wasSaved ? "Removed from read later list." : "Saved for later reading.",
                    wasSaved ? "info" : "success"
                );
            }

            return !wasSaved;
        } catch (error) {
            console.error("Failed to toggle read later:", error);
            if (showFeedback) {
                showToast("Failed to update read later list.", "error");
            }
            return wasSaved;
        }
    };

    return {
        readLaterIds,
        isReadLater,
        toggleReadLater,
    };
}
