import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useFadeSlideScaleIn } from "@/hooks/useFadeSlideScaleIn";
import { useFavorites } from "@/hooks/useFavorites";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";

export function useBookDetailsScreen(bookId: string) {
    const descriptionLineLimit = 3;
    const descriptionToggleThreshold = 140;
    const { accessToken } = useAuth();
    const { showToast } = useToast();
    const { isFavorite, toggleFavorite } = useFavorites();
    const { fadeAnim, slideAnim, scaleAnim } = useFadeSlideScaleIn({
        slideFrom: 40,
        scaleFrom: 0.8,
    });
    const book = useQuery(api.books.get, {
        bookId: bookId as Id<"books">,
    });
    const relatedBooks = useQuery(
        api.books.getRelatedBooks,
        bookId ? { bookId: bookId as Id<"books"> } : "skip"
    );
    const [activeIndex, setActiveIndex] = useState(0);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isQuickAdded, setIsQuickAdded] = useState(false);

    useEffect(() => {
        setIsDescriptionExpanded(false);
    }, [bookId, book?.description]);

    const detailItems = useMemo(() => {
        if (!book) return [];

        return [
            {
                label: "Published",
                value: book.publishedYear ? String(book.publishedYear) : "Unknown",
            },
            {
                label: "Publisher",
                value: book.publisher?.trim() || "Unknown",
            },
            {
                label: "Pages",
                value: book.pageCount ? `${book.pageCount}` : "Unknown",
            },
        ];
    }, [book]);

    const primaryGenre = book?.genre ?? book?.genres?.[0];
    const shouldShowDescriptionToggle =
        (book?.description?.trim().length ?? 0) > descriptionToggleThreshold;
    const relatedSubtitle = relatedBooks?.some((item) => item.author === book?.author)
        ? `More by ${book?.author}`
        : primaryGenre
            ? `Similar ${primaryGenre} reads`
            : "Related picks for you";

    const handleFavoritePress = async () => {
        if (!book) return;
        if (!accessToken) {
            showToast("Sign in to save books to favorites.", "info");
            return;
        }

        const wasFavorite = isFavorite(book._id);
        await toggleFavorite(book._id);
        showToast(
            wasFavorite ? "Removed from favorites." : "Added to favorites.",
            wasFavorite ? "info" : "success"
        );
    };

    const handleQuickAddPress = () => {
        setIsQuickAdded((current) => {
            const next = !current;
            showToast(
                next ? "Book added to your quick list." : "Book removed from your quick list.",
                next ? "success" : "info"
            );
            return next;
        });
    };

    return {
        book,
        relatedBooks,
        activeIndex,
        setActiveIndex,
        isDescriptionExpanded,
        setIsDescriptionExpanded,
        descriptionLineLimit,
        shouldShowDescriptionToggle,
        isQuickAdded,
        detailItems,
        relatedSubtitle,
        isFavorite: book ? isFavorite(book._id) : false,
        handleFavoritePress,
        handleQuickAddPress,
        fadeAnim,
        slideAnim,
        scaleAnim,
        images:
            book?.coverUrls && book.coverUrls.length > 0
                ? book.coverUrls
                : book?.coverUrl
                    ? [book.coverUrl]
                    : [],
    };
}
