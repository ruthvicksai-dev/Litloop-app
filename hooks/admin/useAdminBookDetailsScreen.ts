import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/context/AuthContext";
import { useFadeSlideIn } from "@/hooks/animations/useFadeSlideIn";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

export function useAdminBookDetailsScreen(bookId: string) {
    const { accessToken } = useAuth();
    const { fadeAnim, slideAnim } = useFadeSlideIn({ slideFrom: 20, duration: 400 });

    const book = useQuery(api.books.get, {
        bookId: bookId as Id<"books">,
    });

    const reviews = useQuery(api.reviews.getBookReviews, {
        bookId: bookId as Id<"books">,
        accessToken: accessToken ?? undefined,
    });

    const reviewSummary = useQuery(api.reviews.getBookReviewSummary, {
        bookId: bookId as Id<"books">,
    });

    const bookRentals = useQuery(
        api.rentals.getBookRentals,
        accessToken ? { bookId: bookId as Id<"books">, accessToken } : "skip"
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
        } catch {
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
        } catch {
            return false;
        } finally {
            setUpdatingInventory(false);
        }
    };

    const images =
        book?.coverUrls && book.coverUrls.length > 0
            ? book.coverUrls
            : book?.coverUrl
                ? [book.coverUrl]
                : [];

    const borrowedCopies = book ? book.totalCopies - book.availableCopies : 0;

    const inventoryStatus = !book
        ? "loading"
        : book.availableCopies === 0
            ? "out_of_stock"
            : book.availableCopies <= 2
                ? "low_stock"
                : "in_stock";

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
        fadeAnim,
        slideAnim,
    };
}
