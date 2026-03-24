import { MAIN_GENRES } from "@/constants/mainGenres";
import { SERIES_PAGINATION_OPTS } from "@/constants/pagination";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useBookCoverManager } from "@/hooks/books/useBookCoverManager";
import { applyMetadataToBookForm, parseBookNumericFields } from "@/utils/adminBookForm";
import { fetchBookMetadataExtended } from "@/utils/bookMetadataExtended";
import { validateEnglishSafeDescription } from "@/utils/descriptionPolicy";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

export function useEditBookScreen(bookId: string) {
    const router = useRouter();
    const { showToast } = useToast();
    const { accessToken } = useAuth();

    const book = useQuery(api.books.get, { bookId: bookId as Id<"books"> });
    const updateBook = useMutation(api.books.update);
    const removeBook = useMutation(api.books.remove);
    const generateUploadUrl = useMutation(api.books.generateUploadUrl);

    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [description, setDescription] = useState("");
    const [rentPerDay, setRentPerDay] = useState("");
    const [totalCopies, setTotalCopies] = useState("");
    const [pageCount, setPageCount] = useState("");
    const [publishedYear, setPublishedYear] = useState("");
    const [publisher, setPublisher] = useState("");
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [isTop10, setIsTop10] = useState(false);
    const [top10Position, setTop10Position] = useState("");
    const [isFamous, setIsFamous] = useState(false);
    const [isTrending, setIsTrending] = useState(false);
    const [isSeries, setIsSeries] = useState(false);
    const [series, setSeries] = useState("");
    const [seriesId, setSeriesId] = useState<Id<"book_series"> | undefined>(undefined);
    const [isFetchingBookInfo, setIsFetchingBookInfo] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const seriesList = useQuery(api.series.list, {
        paginationOpts: SERIES_PAGINATION_OPTS,
    });

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

    const toggleGenre = (genre: string) => {
        setSelectedGenres((current) =>
            current.includes(genre)
                ? current.filter((item) => item !== genre)
                : current.length < 3
                    ? [...current, genre]
                    : current
        );
    };

    const toggleTop10 = () => {
        setIsTop10((current) => {
            const next = !current;
            if (!next) setTop10Position("");
            return next;
        });
    };

    const toggleFamous = () => setIsFamous((current) => !current);
    const toggleTrending = () => setIsTrending((current) => !current);
    const toggleSeries = () => {
        setIsSeries((current) => {
            const next = !current;
            if (!next) {
                setSeries("");
                setSeriesId(undefined);
            }
            return next;
        });
    };

    const availableGenres = useMemo(() => MAIN_GENRES, []);

    useEffect(() => {
        if (book === undefined || book === null || initialized) return;

        setTitle(book.title);
        setAuthor(book.author);
        setDescription(book.description);
        setRentPerDay(book.rentPerDay.toString());
        setTotalCopies(book.totalCopies.toString());
        setPageCount(book.pageCount ? String(book.pageCount) : "");
        setPublishedYear(book.publishedYear ? String(book.publishedYear) : "");
        setPublisher(book.publisher ?? "");
        setSelectedGenres(book.genres ?? []);
        setIsTop10(Boolean(book.isTop10));
        setTop10Position(book.top10Position ? String(book.top10Position) : "");
        setIsFamous(Boolean(book.isFamous));
        setIsTrending(Boolean(book.isTrending));
        setIsSeries(Boolean(book.series || book.seriesId));
        setSeries(book.series ?? "");
        setSeriesId(book.seriesId);
        setCoverUris(
            book.coverUrls && book.coverUrls.length > 0
                ? book.coverUrls
                : book.coverUrl
                    ? [book.coverUrl]
                    : []
        );
        setNewImagesSelected(false);
        setInitialized(true);
    }, [book, initialized, setCoverUris, setNewImagesSelected]);

    const handleFetchBookInfo = async () => {
        if (!title.trim()) {
            showToast("Please enter a title to fetch book info.", "error");
            return;
        }

        setIsFetchingBookInfo(true);
        try {
            const metadata = await fetchBookMetadataExtended(title, author);
            applyMetadataToBookForm(
                metadata,
                {
                    setAuthor,
                    setDescription,
                    setSelectedGenres,
                    setPageCount,
                    setPublishedYear,
                    setPublisher,
                },
                { currentAuthor: author }
            );

            if (metadata.descriptionRejectedReason) {
                showToast(
                    `Book info refreshed, but description was skipped: ${metadata.descriptionRejectedReason}`,
                    "error"
                );
            } else {
                showToast("Book info refreshed successfully.", "success");
            }
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to fetch book info.";
            showToast(message, "error");
        } finally {
            setIsFetchingBookInfo(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim() || !author.trim() || !rentPerDay || !totalCopies) {
            showToast("Please fill all required fields.", "error");
            return;
        }

        const descriptionValidation = validateEnglishSafeDescription(description);
        if (!descriptionValidation.ok) {
            showToast(descriptionValidation.reason, "error");
            return;
        }

        setLoading(true);
        try {
            const parsed = parseBookNumericFields({
                rentPerDay,
                totalCopies,
                pageCount,
                publishedYear,
                top10Position,
                isTop10,
            });

            let coverImageIds: Id<"_storage">[] | undefined;

            if (newImagesSelected && coverUris.length > 0) {
                if (!accessToken) throw new Error("Unauthenticated");
                coverImageIds = await Promise.all(
                    coverUris.map(async (uri) => {
                        const uploadUrl = await generateUploadUrl({ accessToken });
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

            const payload: any = {
                accessToken,
                bookId: bookId as Id<"books">,
                title,
                author,
                description,
                genre: selectedGenres[0],
                genres: selectedGenres,
                rentPerDay: parsed.rentPerDay,
                totalCopies: parsed.totalCopies,
                pageCount: parsed.pageCount,
                publishedYear: parsed.publishedYear,
                publisher: publisher.trim() || undefined,
                isTop10,
                top10Position: parsed.top10Position,
                isFamous,
                isTrending,
                series: isSeries ? series.trim() || undefined : undefined,
                seriesId: isSeries ? seriesId : undefined,
            };

            if (coverImageIds) {
                payload.coverImages = coverImageIds;
            } else if (newImagesSelected && coverUris.length === 0) {
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
                            if (!accessToken) throw new Error("Unauthenticated");
                            await removeBook({ accessToken, bookId: bookId as Id<"books"> });
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
        pageCount,
        setPageCount,
        publishedYear,
        setPublishedYear,
        publisher,
        setPublisher,
        selectedGenres,
        availableGenres,
        isTop10,
        setIsTop10,
        toggleTop10,
        top10Position,
        setTop10Position,
        isFamous,
        setIsFamous,
        toggleFamous,
        isTrending,
        setIsTrending,
        toggleTrending,
        isSeries,
        setIsSeries,
        toggleSeries,
        series,
        setSeries,
        seriesId,
        setSeriesId,
        seriesList: seriesList?.page ?? [],
        isFetchingBookInfo,
        toggleGenre,
        loading,
        deleting,
        handleFetchBookInfo,
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
