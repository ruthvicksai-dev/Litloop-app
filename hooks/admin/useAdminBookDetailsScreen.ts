import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuthState } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useFadeSlideIn } from "@/hooks/animations/useFadeSlideIn";
import { useMutation, useQuery } from "convex/react";
import { useState, useMemo } from "react";

export function useAdminBookDetailsScreen(bookId: string) {
    const { accessToken } = useAuthState();
    const { showToast } = useToast();
    const { fadeAnim, slideAnim } = useFadeSlideIn({ slideFrom: 20, duration: 400 });

    const [reviewsLimit, setReviewsLimit] = useState(3);
    const [rentalsLimit, setRentalsLimit] = useState(5);

    const book = useQuery(api.books.get, {
        bookId: bookId as Id<"books">,
    });

    const reviews = useQuery(api.reviews.getBookReviews, {
        bookId: bookId as Id<"books">,
        accessToken: accessToken ?? undefined,
        limit: reviewsLimit,
    });

    const reviewSummary = useQuery(api.reviews.getBookReviewSummary, {
        bookId: bookId as Id<"books">,
    });

    const bookRentals = useQuery(
        api.rentals.getBookRentals,
        accessToken ? { bookId: bookId as Id<"books">, accessToken, limit: rentalsLimit } : "skip"
    );

    const removeBook = useMutation(api.books.remove);
    const updateBook = useMutation(api.books.update);

    const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [inventoryValue, setInventoryValue] = useState<string>("");
    const [updatingInventory, setUpdatingInventory] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const handleDeletePress = () => {
        if (!book) return;
        setDeleteTarget({ id: book._id, title: book.title });
    };

    const confirmDelete = async () => {
        if (!deleteTarget || !accessToken) return;
        try {
            setDeleting(true);
            await removeBook({ accessToken, bookId: deleteTarget.id as Id<"books"> });
            setDeleteTarget(null);
            return true; // Signal success so page can navigate back
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to delete book.";
            showToast(message, "error");
            setDeleting(false);
            return false;
        }
    };

    const cancelDelete = () => {
        setDeleteTarget(null);
    };

    const handleUpdateInventory = async () => {
        if (!book || !accessToken) return false;
        const newTotal = parseInt(inventoryValue, 10);
        if (isNaN(newTotal) || newTotal < 0) return false;

        try {
            setUpdatingInventory(true);
            await updateBook({
                accessToken,
                bookId: book._id as Id<"books">,
                totalCopies: newTotal,
            });
            setInventoryValue("");
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to update inventory.";
            showToast(message, "error");
            return false;
        } finally {
            setUpdatingInventory(false);
        }
    };

    const loadMoreReviews = () => setReviewsLimit(prev => prev + 10);
    const loadMoreRentals = () => setRentalsLimit(prev => prev + 10);

    const images = useMemo(() => {
        return book?.coverUrls && book.coverUrls.length > 0
            ? book.coverUrls
            : book?.coverUrl
                ? [book.coverUrl]
                : [];
    }, [book?.coverUrls, book?.coverUrl]);

    const borrowedCopies = useMemo(() => {
        return book ? book.totalCopies - book.availableCopies : 0;
    }, [book?.totalCopies, book?.availableCopies]);

    const inventoryStatus = useMemo(() => {
        if (!book) return "loading";
        if (book.availableCopies === 0) return "out_of_stock";
        if (book.availableCopies <= 2) return "low_stock";
        return "in_stock";
    }, [book?.availableCopies]);

    return {
        book,
        reviews,
        reviewSummary,
        bookRentals,
        images,
        borrowedCopies,
        inventoryStatus,
        deleteTarget,
        deleting,
        inventoryValue,
        setInventoryValue,
        updatingInventory,
        isDescriptionExpanded,
        setIsDescriptionExpanded,
        handleDeletePress,
        confirmDelete,
        cancelDelete,
        handleUpdateInventory,
        loadMoreReviews,
        loadMoreRentals,
        reviewsLimit,
        rentalsLimit,
        fadeAnim,
        slideAnim,
    };
}
