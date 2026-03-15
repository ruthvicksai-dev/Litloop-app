import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery } from "convex/react";

export function useFavorites() {
    const { accessToken } = useAuth();

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
    const toggleFavorite = async (bookId: string) => {
        try {
            if (!accessToken) {
                console.warn("Must be signed in to favorite books.");
                return;
            }
            await toggleMut({ accessToken, bookId: bookId as Id<"books"> });
        } catch (error) {
            console.error("Failed to toggle favorite:", error);
            // Optionally could add toast here in the future
        }
    };

    return {
        favoriteIds,
        isFavorite,
        toggleFavorite,
    };
}
