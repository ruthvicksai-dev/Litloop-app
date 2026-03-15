import { MAIN_GENRES } from "@/constants/mainGenres";
import { api } from "@/convex/_generated/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePaginatedQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";

const POPULAR_GENRES = ["Action", "Romance", "Sci-Fi", "Mystery", "Fantasy"] as const;

export function useSearchScreen() {
    const [searchText, setSearchText] = useState("");
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [showAllGenres, setShowAllGenres] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText, 400);
    const normalizedSearch = debouncedSearchText.trim();

    const queryArgs = useMemo(
        () => ({
            searchText: normalizedSearch ? normalizedSearch : undefined,
            genre: selectedGenre ?? undefined,
        }),
        [normalizedSearch, selectedGenre]
    );

    const { results, status, loadMore } = usePaginatedQuery(
        api.books.searchBooks,
        queryArgs,
        { initialNumItems: 12 }
    );

    const searchResults = useMemo(
        () =>
            results.map((book) => ({
                _id: book._id,
                title: book.title,
                author: book.author,
                rating: typeof book.rating === "number" ? book.rating : 0,
                coverUrl: book.coverUrl ?? null,
                description: book.description,
                rentPerDay: book.rentPerDay,
                availableCopies: book.availableCopies,
                bookViews: typeof book.bookViews === "number" ? book.bookViews : 0,
                bookRentals: typeof book.bookRentals === "number" ? book.bookRentals : 0,
            })),
        [results]
    );

    const toggleGenre = useCallback((genre: string) => {
        setSelectedGenre((current) => (current === genre ? null : genre));
    }, []);

    const clearFilters = useCallback(() => {
        setSearchText("");
        setSelectedGenre(null);
    }, []);

    return {
        searchText,
        setSearchText,
        selectedGenre,
        toggleGenre,
        showAllGenres,
        setShowAllGenres,
        clearFilters,
        popularGenres: POPULAR_GENRES,
        allGenres: MAIN_GENRES,
        searchResults,
        status,
        loadMore,
        loadingFirstPage: status === "LoadingFirstPage",
    };
}
