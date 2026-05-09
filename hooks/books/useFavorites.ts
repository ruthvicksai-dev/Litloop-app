import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuthState } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useMutation, useQuery } from "convex/react";

type ToggleFavoriteOptions = {
    showFeedback?: boolean;
};

export function useFavorites() {
    const { accessToken } = useAuthState();
    const { showToast } = useToast();

    // 1. Fetch user's favorite book IDs
    const favoriteIds =
        useQuery(
            api.favorites.getUserFavoriteIds,
            accessToken ? { accessToken } : "skip"
        ) ?? [];

    // 2. The mutation to toggle
    const toggleMut = useMutation(api.favorites.toggleFavorite);

    // 3. Helper to check if a specific book is favorited
    const isFavorite = (bookId: string) => {
        return favoriteIds.includes(bookId as Id<"books">);
    };

    // 4. Wrapped toggle function for easy UI usage
    const toggleFavorite = async (
        bookId: string,
        options: ToggleFavoriteOptions = {}
    ) => {
        const { showFeedback = true } = options;
        const wasFavorite = isFavorite(bookId);

        try {
            if (!accessToken) {
                if (showFeedback) {
                    showToast("Sign in to save books to favorites.", "info");
                }
                return false;
            }

            await toggleMut({ accessToken, bookId: bookId as Id<"books"> });

            if (showFeedback) {
                showToast(
                    wasFavorite ? "Removed from favorites." : "Added to favorites.",
                    wasFavorite ? "info" : "success"
                );
            }

            return !wasFavorite;
        } catch (error) {
            console.error("Failed to toggle favorite:", error);
            if (showFeedback) {
                showToast("Failed to update favorites.", "error");
            }
            return wasFavorite;
        }
    };

    return {
        favoriteIds,
        isFavorite,
        toggleFavorite,
    };
}
