import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useBookCoverManager } from "./useBookCoverManager";

export function useEditBookScreen(bookId: string) {
    const router = useRouter();
    const { showToast } = useToast();

    const book = useQuery(api.books.get, { bookId: bookId as Id<"books"> });
    const updateBook = useMutation(api.books.update);
    const removeBook = useMutation(api.books.remove);
    const generateUploadUrl = useMutation(api.books.generateUploadUrl);

    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [description, setDescription] = useState("");
    const [rentPerDay, setRentPerDay] = useState("");
    const [totalCopies, setTotalCopies] = useState("");
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const {
        coverUris,
        setCoverUris,
        isFetchingCover,
        newImagesSelected,
        setNewImagesSelected,
        fetchCover,
        pickImages,
        removeCover,
    } = useBookCoverManager({
        title,
        author,
        onError: (message) => showToast(message, "error"),
        onSuccess: (message) => showToast(message, "success"),
    });

    useEffect(() => {
        if (book === undefined || book === null) return;

        if (!initialized) {
            setTitle(book.title);
            setAuthor(book.author);
            setDescription(book.description);
            setRentPerDay(book.rentPerDay.toString());
            setTotalCopies(book.totalCopies.toString());
            setCoverUris(
                book.coverUrls && book.coverUrls.length > 0
                    ? book.coverUrls
                    : book.coverUrl
                        ? [book.coverUrl]
                        : []
            );
            setNewImagesSelected(false);
            setInitialized(true);
        }
    }, [book, initialized, setCoverUris, setNewImagesSelected]);

    const handleSave = async () => {
        if (!title.trim() || !author.trim() || !rentPerDay || !totalCopies) {
            showToast("Please fill all required fields.", "error");
            return;
        }

        const rent = parseInt(rentPerDay, 10);
        const copies = parseInt(totalCopies, 10);

        if (Number.isNaN(rent) || rent <= 0) {
            showToast("Rent per day must be a valid positive number.", "error");
            return;
        }
        if (Number.isNaN(copies) || copies <= 0) {
            showToast("Total copies must be a valid positive number.", "error");
            return;
        }

        setLoading(true);
        try {
            let coverImageIds: Id<"_storage">[] | undefined;

            if (newImagesSelected && coverUris.length > 0) {
                coverImageIds = await Promise.all(
                    coverUris.map(async (uri) => {
                        const uploadUrl = await generateUploadUrl();
                        const response = await fetch(uri);
                        const blob = await response.blob();
                        const uploadResult = await fetch(uploadUrl, {
                            method: "POST",
                            headers: { "Content-Type": blob.type || "image/jpeg" },
                            body: blob,
                        });
                        const { storageId } = await uploadResult.json();
                        return storageId as Id<"_storage">;
                    })
                );
            }

            const payload: {
                bookId: Id<"books">;
                title: string;
                author: string;
                description: string;
                rentPerDay: number;
                totalCopies: number;
                coverImages?: Id<"_storage">[];
            } = {
                bookId: bookId as Id<"books">,
                title,
                author,
                description,
                rentPerDay: rent,
                totalCopies: copies,
            };

            if (coverImageIds) {
                payload.coverImages = coverImageIds;
            } else if (
                newImagesSelected &&
                coverUris.length === 0
            ) {
                payload.coverImages = [];
            }

            await updateBook(payload);
            showToast("Book updated successfully!", "success");
            router.back();
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to update book.";
            showToast(message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Book",
            "Are you sure you want to delete this book? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await removeBook({ bookId: bookId as Id<"books"> });
                            showToast("Book deleted safely.", "success");
                            router.replace("/(admin)/books");
                        } catch (error: unknown) {
                            const message =
                                error instanceof Error
                                    ? error.message
                                    : "Failed to delete book.";
                            showToast(message, "error");
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    return {
        book,
        title,
        setTitle,
        author,
        setAuthor,
        description,
        setDescription,
        rentPerDay,
        setRentPerDay,
        totalCopies,
        setTotalCopies,
        loading,
        deleting,
        handleSave,
        handleDelete,
        coverUris,
        isFetchingCover,
        newImagesSelected,
        fetchCover,
        pickImages,
        removeCover,
    };
}
