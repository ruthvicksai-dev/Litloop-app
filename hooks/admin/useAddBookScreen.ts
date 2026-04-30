import { MAIN_GENRES } from "@/constants/mainGenres";
import { SERIES_PAGINATION_OPTS } from "@/constants/pagination";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useBookCoverManager } from "@/hooks/books/useBookCoverManager";
import { 
    applyMetadataToBookForm, 
    parseBookNumericFields,
    fetchBookMetadataExtended,
    validateEnglishSafeDescription 
} from "@/utils";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";

export function useAddBookScreen() {
    const { showToast } = useToast();
    const { accessToken } = useAuth();
    const router = useRouter();
    const addBook = useMutation(api.books.add);
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

    const seriesList = useQuery(api.series.list, {
        paginationOpts: SERIES_PAGINATION_OPTS,
    });

    const coverManager = useBookCoverManager({
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

    const availableGenres = useMemo(
        () => MAIN_GENRES,
        []
    );

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
                    `Book info fetched, but description was skipped: ${metadata.descriptionRejectedReason}`,
                    "error"
                );
            } else {
                showToast("Book info fetched successfully.", "success");
            }
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to fetch book info.";
            showToast(message, "error");
        } finally {
            setIsFetchingBookInfo(false);
        }
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
                top10Position,
                isTop10,
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
                isTop10,
                top10Position: parsed.top10Position,
                isFamous,
                isTrending,
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
        handleFetchBookInfo,
        handleAddBook,
        ...coverManager,
    };
}
