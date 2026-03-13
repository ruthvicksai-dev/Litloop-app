import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

const MAX_COVERS = 2;
const MIN_HD_WIDTH = 400;
const SERP_API_KEY = process.env.EXPO_PUBLIC_SERPAPI_KEY;

type UseBookCoverManagerOptions = {
    title: string;
    author: string;
    initialCoverUris?: string[];
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
};

type GoogleBooksItem = {
    volumeInfo?: {
        industryIdentifiers?: Array<{
            type: string;
            identifier: string;
        }>;
        imageLinks?: {
            extraLarge?: string;
            large?: string;
            medium?: string;
            small?: string;
            thumbnail?: string;
            smallThumbnail?: string;
        };
    };
};

type GoogleBooksResponse = {
    items?: GoogleBooksItem[];
};

type SerpImageResult = {
    original?: string;
    original_width?: number;
    width?: number;
};

type SerpApiResponse = {
    images_results?: SerpImageResult[];
};

export function useBookCoverManager({
    title,
    author,
    initialCoverUris = [],
    onError,
    onSuccess,
}: UseBookCoverManagerOptions) {
    const [coverUris, setCoverUris] = useState<string[]>(initialCoverUris);
    const [isFetchingCover, setIsFetchingCover] = useState(false);
    const [newImagesSelected, setNewImagesSelected] = useState(false);

    const normalizeGoogleCoverUrl = (url: string) => {
        const secureUrl = url.replace(/^http:\/\//i, "https://");
        const withoutEdge = secureUrl.replace(/([?&])edge=curl/gi, "");

        if (/([?&])zoom=\d+/i.test(withoutEdge)) {
            return withoutEdge.replace(/([?&])zoom=\d+/i, "$1zoom=5");
        }

        return `${withoutEdge}${withoutEdge.includes("?") ? "&" : "?"}zoom=5`;
    };

    const toLimitedUniqueUrls = (urls: string[]) => {
        return Array.from(new Set(urls.filter(Boolean))).slice(0, MAX_COVERS);
    };

    const appendCandidates = (existing: string[], incoming: string[]) => {
        return toLimitedUniqueUrls([...existing, ...incoming]);
    };

    const fetchGoogleBooksData = async () => {
        const query = `intitle:${encodeURIComponent(title.trim())}`;
        const authorQuery = author.trim()
            ? `+inauthor:${encodeURIComponent(author.trim())}`
            : "";
        const url = `https://www.googleapis.com/books/v1/volumes?q=${query}${authorQuery}`;

        const response = await fetch(url);
        return (await response.json()) as GoogleBooksResponse;
    };

    const getIsbnFromBookInfo = (bookInfo?: GoogleBooksItem["volumeInfo"]) => {
        if (!bookInfo?.industryIdentifiers) {
            return "";
        }

        const isbn13 = bookInfo.industryIdentifiers.find(
            (identifier) => identifier.type === "ISBN_13"
        );
        const isbn10 = bookInfo.industryIdentifiers.find(
            (identifier) => identifier.type === "ISBN_10"
        );

        return isbn13?.identifier || isbn10?.identifier || "";
    };

    const getGoogleCoverCandidates = (
        bookInfo?: GoogleBooksItem["volumeInfo"]
    ) => {
        if (!bookInfo?.imageLinks) {
            return [];
        }

        return [
            bookInfo.imageLinks.extraLarge,
            bookInfo.imageLinks.large,
            bookInfo.imageLinks.medium,
        ]
            .filter(Boolean)
            .map((curr) => normalizeGoogleCoverUrl(curr as string));
    };

    const fetchOpenLibraryCovers = async (isbn: string) => {
        if (!isbn) {
            return [];
        }

        const largeCoverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;

        try {
            const response = await fetch(largeCoverUrl);
            if (response.ok) {
                return [largeCoverUrl.replace("?default=false", "")];
            }
        } catch (error) {
            console.log("OpenLibrary cover fetch skipped", error);
        }

        return [];
    };

    const fetchHdSearchResults = async () => {
        if (!SERP_API_KEY) {
            return [];
        }

        const query = `${title.trim()} ${author.trim()} book cover`.trim();
        if (!query) {
            return [];
        }

        try {
            const params = new URLSearchParams({
                engine: "google_images",
                q: query,
                api_key: SERP_API_KEY,
                num: "10",
                safe: "active",
            });
            const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
            const data = (await response.json()) as SerpApiResponse;

            const urls = (data.images_results || [])
                .filter((result) => {
                    const width = result.original_width || result.width || 0;
                    return Boolean(result.original) && width > MIN_HD_WIDTH;
                })
                .map((result) => result.original as string);

            return toLimitedUniqueUrls(urls);
        } catch (error) {
            console.log("HD image search fallback skipped", error);
            return [];
        }
    };

    const fetchCover = async () => {
        if (!title.trim()) {
            onError("Please enter a title to fetch cover.");
            return;
        }

        setIsFetchingCover(true);
        try {
            let fetchedUrls: string[] = [];
            const data = await fetchGoogleBooksData();
            const items = data.items || [];

            for (const item of items) {
                const bookInfo = item.volumeInfo;

                fetchedUrls = appendCandidates(
                    fetchedUrls,
                    getGoogleCoverCandidates(bookInfo)
                );

                if (fetchedUrls.length >= MAX_COVERS) {
                    break;
                }

                const isbn = getIsbnFromBookInfo(bookInfo);
                fetchedUrls = appendCandidates(
                    fetchedUrls,
                    await fetchOpenLibraryCovers(isbn)
                );

                if (fetchedUrls.length >= MAX_COVERS) {
                    break;
                }
            }

            if (fetchedUrls.length < MAX_COVERS) {
                fetchedUrls = appendCandidates(
                    fetchedUrls,
                    await fetchHdSearchResults()
                );
            }

            if (fetchedUrls.length > 0) {
                setCoverUris((prev) => toLimitedUniqueUrls([...prev, ...fetchedUrls]));
                setNewImagesSelected(true);
                onSuccess("Book cover(s) fetched successfully!");
                return;
            }

            onError("No cover found. Please upload manually.");
        } catch {
            onError("Failed to fetch cover. Check your connection.");
        } finally {
            setIsFetchingCover(false);
        }
    };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
        selectionLimit: MAX_COVERS,
    });

    if (!result.canceled && result.assets.length > 0) {
        setCoverUris((prev) =>
            toLimitedUniqueUrls([
                ...prev,
                ...result.assets.map((asset) => asset.uri),
            ])
        );

        setNewImagesSelected(true);
    }
};

    const removeCover = (index: number) => {
        setCoverUris((current) => current.filter((_, itemIndex) => itemIndex !== index));
        setNewImagesSelected(true);
    };

    return {
        coverUris,
        setCoverUris,
        isFetchingCover,
        newImagesSelected,
        setNewImagesSelected,
        fetchCover,
        pickImages,
        removeCover,
    };
}
