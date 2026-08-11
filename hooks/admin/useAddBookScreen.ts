import { MAIN_GENRES } from "@/constants/mainGenres";
import { SERIES_PAGINATION_OPTS } from "@/constants/pagination";
import { useAuthState } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useBookCoverManager } from "@/hooks/books/useBookCoverManager";
import { 
    applyMetadataToBookForm, 
    parseBookNumericFields,
    validateEnglishSafeDescription 
} from "@/utils";
import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";

export type AddBookPrefillParams = {
    scannedIsbn?: string;
    manual?: string;
};

export function useAddBookScreen(params?: AddBookPrefillParams) {
    const { showToast } = useToast();
    const { accessToken } = useAuthState();
    const router = useRouter();
    const addBook = useMutation(api.books.add);
    const generateUploadUrl = useMutation(api.books.generateUploadUrl);
    const lookupBookAction = useAction(api.bookMetadata.lookupBookByIsbn);

    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [isbn, setIsbn] = useState("");
    const [isManualLookupVisible, setIsManualLookupVisible] = useState(false);
    const [hasFetchedBookInfo, setHasFetchedBookInfo] = useState(false);
    const [description, setDescription] = useState("");
    const [rentPerDay, setRentPerDay] = useState("");
    const [totalCopies, setTotalCopies] = useState("");
    const [pageCount, setPageCount] = useState("");
    const [publishedYear, setPublishedYear] = useState("");
    const [publisher, setPublisher] = useState("");
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [isSeries, setIsSeries] = useState(false);
    const [series, setSeries] = useState("");
    const [seriesId, setSeriesId] = useState<Id<"book_series"> | undefined>(undefined);
    const [isFetchingBookInfo, setIsFetchingBookInfo] = useState(false);
    const [loading, setLoading] = useState(false);

    const prefillApplied = useRef(false);
    const shouldAutoFetchCover = useRef(false);

    const seriesList = useQuery(api.series.list,
        hasFetchedBookInfo || isManualLookupVisible
            ? { paginationOpts: SERIES_PAGINATION_OPTS }
            : "skip"
    );

    const coverManager = useBookCoverManager({
        title,
        author,
        isbn,
        onError: (message) => showToast(message, "error"),
        onSuccess: (message) => showToast(message, "success"),
    });

    // Auto-fetch metadata when arriving from scan page with ISBN
    useEffect(() => {
        if (prefillApplied.current) return;

        if (params?.scannedIsbn) {
            prefillApplied.current = true;
            setIsbn(params.scannedIsbn);
            setIsFetchingBookInfo(true);

            lookupBookAction({ isbn: params.scannedIsbn, accessToken: accessToken || "" })
                .then((result) => {
                    if (result.status === "EXISTING_BOOK") {
                        showToast(result.message || "A book with this ISBN already exists.", "error");
                        setIsManualLookupVisible(true);
                        setHasFetchedBookInfo(true);
                        return;
                    }
                    if (result.status === "INVALID_ISBN") {
                        showToast(result.message || "Invalid ISBN format.", "error");
                        setIsManualLookupVisible(true);
                        setHasFetchedBookInfo(true);
                        return;
                    }
                    if (result.status === "NOT_FOUND" || result.status === "PROVIDER_UNAVAILABLE") {
                        showToast(result.message || "Book details not found. Please enter manually.", "error");
                        setIsManualLookupVisible(true);
                        setHasFetchedBookInfo(true);
                        return;
                    }

                    if (result.metadata) {
                        applyMetadataToBookForm(
                            result.metadata,
                            {
                                setTitle,
                                setAuthor,
                                setDescription,
                                setSelectedGenres,
                                setPageCount,
                                setPublishedYear,
                                setPublisher,
                                setIsbn,
                            },
                            { currentTitle: "", currentAuthor: "" }
                        );
                        if (result.metadata.coverCandidates && result.metadata.coverCandidates.length > 0) {
                            coverManager.setCoverUris(result.metadata.coverCandidates);
                        }
                        if (result.metadata.descriptionRejectedReason) {
                            showToast(
                                `Book info fetched, but description was skipped: ${result.metadata.descriptionRejectedReason}`,
                                "error"
                            );
                        } else {
                            showToast("Book info fetched successfully.", "success");
                        }
                        setHasFetchedBookInfo(true);
                    }
                })
                .catch((error: unknown) => {
                    const message =
                        error instanceof Error ? error.message : "Failed to fetch book info.";
                    showToast(message, "error");
                })
                .finally(() => {
                    setIsFetchingBookInfo(false);
                });
        } else if (params?.manual === "true") {
            setIsManualLookupVisible(true);
            setHasFetchedBookInfo(true);
            prefillApplied.current = true;
        }
    }, [params, showToast, accessToken, lookupBookAction, coverManager]);

    // Auto-fetch cover after metadata state has been applied if candidates weren't auto-set
    useEffect(() => {
        if (shouldAutoFetchCover.current && (title.trim() || isbn.trim())) {
            shouldAutoFetchCover.current = false;
            void coverManager.fetchCover();
        }
    }, [title, isbn, coverManager]);

    const toggleGenre = (genre: string) => {
        setSelectedGenres((current) =>
            current.includes(genre)
                ? current.filter((item) => item !== genre)
                : current.length < 3
                    ? [...current, genre]
                    : current
        );
    };

    const availableGenres = useMemo(
        () => MAIN_GENRES,
        []
    );

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

    const fetchBookInfo = async (isbnOverride?: string) => {
        const lookupIsbn = isbnOverride ?? isbn;

        if (!lookupIsbn.trim() && !title.trim() && !author.trim()) {
            showToast("Enter ISBN, or enter Title / Author to fetch book details.", "error");
            return;
        }

        setIsFetchingBookInfo(true);
        try {
            const result = await lookupBookAction({
                isbn: lookupIsbn.trim() || undefined,
                title: title.trim() || undefined,
                author: author.trim() || undefined,
                accessToken: accessToken || "",
            });

            if (result.status === "EXISTING_BOOK") {
                showToast(result.message || "A book with this ISBN already exists.", "error");
                setIsManualLookupVisible(true);
                setHasFetchedBookInfo(true);
                return;
            }
            if (result.status === "INVALID_ISBN") {
                showToast(result.message || "Invalid ISBN format.", "error");
                setIsManualLookupVisible(true);
                setHasFetchedBookInfo(true);
                return;
            }
            if (result.status === "NOT_FOUND" || result.status === "PROVIDER_UNAVAILABLE") {
                showToast(result.message || "Book details not found. Please enter manually.", "error");
                setIsManualLookupVisible(true);
                setHasFetchedBookInfo(true);
                return;
            }

            if (result.metadata) {
                applyMetadataToBookForm(
                    result.metadata,
                    {
                        setTitle,
                        setAuthor,
                        setDescription,
                        setSelectedGenres,
                        setPageCount,
                        setPublishedYear,
                        setPublisher,
                        setIsbn,
                    },
                    { currentTitle: title, currentAuthor: author }
                );
                if (result.metadata.coverCandidates && result.metadata.coverCandidates.length > 0) {
                    coverManager.setCoverUris(result.metadata.coverCandidates);
                }
                if (result.metadata.descriptionRejectedReason) {
                    showToast(
                        `Book info fetched, but description was skipped: ${result.metadata.descriptionRejectedReason}`,
                        "error"
                    );
                } else {
                    showToast(result.message || "Book info fetched successfully.", "success");
                }
                setHasFetchedBookInfo(true);
            }
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to fetch book info.";
            showToast(message, "error");
        } finally {
            setIsFetchingBookInfo(false);
        }
    };

    const handleFetchBookInfo = () => fetchBookInfo();

    const handleUseManualMethod = () => {
        setIsManualLookupVisible(true);
        setHasFetchedBookInfo(true);
    };

    const handleAddBook = async () => {
        if (!title.trim()) {
            showToast("Title is required.", "error");
            return;
        }
        if (!author.trim()) {
            showToast("Author is required.", "error");
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
            });

            let uploadedCoverImages: Id<"_storage">[] = [];

            if (!accessToken) throw new Error("Unauthenticated");

            if (coverManager.coverUris.length > 0) {
                const uploadPromises = coverManager.coverUris.map(async (uri) => {
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
                });

                uploadedCoverImages = await Promise.all(uploadPromises);
            }

            await addBook({
                accessToken,
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
                isbn: isbn.trim() || undefined,
                series: isSeries ? series.trim() || undefined : undefined,
                seriesId: isSeries ? seriesId : undefined,
                coverImages: uploadedCoverImages.length > 0 ? uploadedCoverImages : undefined,
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
        isbn,
        setIsbn,
        isManualLookupVisible,
        setIsManualLookupVisible,
        hasFetchedBookInfo,
        isBookFormVisible: isManualLookupVisible || hasFetchedBookInfo,
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
        handleFetchBookInfo,
        handleUseManualMethod,
        handleAddBook,
        ...coverManager,
    };
}
