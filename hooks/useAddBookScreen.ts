import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useBookCoverManager } from "./useBookCoverManager";

export function useAddBookScreen() {
    const { showToast } = useToast();
    const router = useRouter();
    const addBook = useMutation(api.books.add);
    const generateUploadUrl = useMutation(api.books.generateUploadUrl);

    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [description, setDescription] = useState("");
    const [rentPerDay, setRentPerDay] = useState("");
    const [totalCopies, setTotalCopies] = useState("");
    const [loading, setLoading] = useState(false);

    const coverManager = useBookCoverManager({
        title,
        author,
        onError: (message) => showToast(message, "error"),
        onSuccess: (message) => showToast(message, "success"),
    });

    const handleAddBook = async () => {
        if (!title.trim()) {
            showToast("Title is required.", "error");
            return;
        }
        if (!author.trim()) {
            showToast("Author is required.", "error");
            return;
        }
        if (!rentPerDay || Number(rentPerDay) <= 0) {
            showToast("Valid rent per day is required.", "error");
            return;
        }
        if (!totalCopies || Number(totalCopies) <= 0) {
            showToast("Valid total copies is required.", "error");
            return;
        }

        setLoading(true);
        try {
            let coverImages: string[] = [];

            if (coverManager.coverUris.length > 0) {
                const uploadPromises = coverManager.coverUris.map(async (uri) => {
                    const uploadUrl = await generateUploadUrl();
                    const response = await fetch(uri);
                    const blob = await response.blob();
                    const uploadResult = await fetch(uploadUrl, {
                        method: "POST",
                        headers: { "Content-Type": blob.type || "image/jpeg" },
                        body: blob,
                    });
                    const { storageId } = await uploadResult.json();
                    return storageId;
                });

                coverImages = await Promise.all(uploadPromises);
            }

            await addBook({
                title,
                author,
                description,
                rentPerDay: Number(rentPerDay),
                totalCopies: Number(totalCopies),
                coverImages:
                    coverImages.length > 0
                        ? (coverImages as Id<"_storage">[])
                        : undefined,
            });

            showToast("Book added successfully!", "success");
            router.back();
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to add book.";
            showToast(message, "error");
        } finally {
            setLoading(false);
        }
    };

    return {
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
        handleAddBook,
        ...coverManager,
    };
}
