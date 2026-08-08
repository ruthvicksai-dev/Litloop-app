import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

const MAX_COVERS = 2;

type UseBookCoverManagerOptions = {
    title: string;
    author: string;
    isbn?: string;
    initialCoverUris?: string[];
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
};

type OpenLibrarySearchDoc = {
    cover_i?: number;
    isbn?: string[];
};

type OpenLibrarySearchResponse = {
    docs?: OpenLibrarySearchDoc[];
};

export function useBookCoverManager({
    title,
    author,
    isbn,
    initialCoverUris = [],
    onError,
    onSuccess,
}: UseBookCoverManagerOptions) {
    const [coverUris, setCoverUris] = useState<string[]>(initialCoverUris);
    const [isFetchingCover, setIsFetchingCover] = useState(false);
    const [newImagesSelected, setNewImagesSelected] = useState(false);

    const toLimitedUniqueUrls = (urls: string[]) => {
        return Array.from(new Set(urls.filter(Boolean))).slice(0, MAX_COVERS);
    };

    const appendCandidates = (existing: string[], incoming: string[]) => {
        return toLimitedUniqueUrls([...existing, ...incoming]);
    };

    const normalizedIsbn = isbn?.replace(/[-\s]/g, "").trim().toUpperCase() || "";

    const fetchOpenLibrarySearchData = async () => {
        if (normalizedIsbn) {
            const response = await fetch(`https://openlibrary.org/search.json?isbn=${encodeURIComponent(normalizedIsbn)}`);
            if (!response.ok) {
                throw new Error("OpenLibrary ISBN cover search failed.");
            }
            return (await response.json()) as OpenLibrarySearchResponse;
        }

        const titleQuery = `title=${encodeURIComponent(title.trim())}`;
        const authorQuery = author.trim()
            ? `&author=${encodeURIComponent(author.trim())}`
            : "";
        const response = await fetch(`https://openlibrary.org/search.json?${titleQuery}${authorQuery}`);
        if (!response.ok) {
            throw new Error("OpenLibrary cover search failed.");
        }
        return (await response.json()) as OpenLibrarySearchResponse;
    };

    const getIsbnFromOpenLibraryDoc = (doc?: OpenLibrarySearchDoc) => {
        if (!doc?.isbn) {
            return "";
        }
        return doc.isbn.find((value) => value.length === 13) || doc.isbn[0] || "";
    };

    const fetchOpenLibraryCovers = async (isbnVal: string) => {
        if (!isbnVal) {
            return [];
        }

        const largeCoverUrl = `https://covers.openlibrary.org/b/isbn/${isbnVal}-L.jpg?default=false`;

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

    const fetchOpenLibraryCoverById = async (coverId?: number) => {
        if (!coverId) {
            return [];
        }

        const largeCoverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg?default=false`;

        try {
            const response = await fetch(largeCoverUrl);
            if (response.ok) {
                return [largeCoverUrl.replace("?default=false", "")];
            }
        } catch (error) {
            console.log("OpenLibrary cover id fetch skipped", error);
        }

        return [];
    };

    const fetchOpenLibrarySearchCovers = async () => {
        try {
            const data = await fetchOpenLibrarySearchData();
            let fetchedUrls: string[] = [];

            for (const doc of data.docs || []) {
                fetchedUrls = appendCandidates(
                    fetchedUrls,
                    await fetchOpenLibraryCoverById(doc.cover_i)
                );

                if (fetchedUrls.length >= MAX_COVERS) {
                    break;
                }

                fetchedUrls = appendCandidates(
                    fetchedUrls,
                    await fetchOpenLibraryCovers(getIsbnFromOpenLibraryDoc(doc))
                );

                if (fetchedUrls.length >= MAX_COVERS) {
                    break;
                }
            }

            return fetchedUrls;
        } catch (error) {
            console.log("OpenLibrary cover search skipped", error);
            return [];
        }
    };

    const fetchCover = async () => {
        if (!normalizedIsbn && (!title.trim() || !author.trim())) {
            onError("Enter ISBN, or enter title and author to fetch book covers.");
            return;
        }

        setIsFetchingCover(true);
        try {
            let fetchedUrls: string[] = [];

            if (normalizedIsbn) {
                fetchedUrls = appendCandidates(
                    fetchedUrls,
                    await fetchOpenLibraryCovers(normalizedIsbn)
                );
            }

            if (fetchedUrls.length < MAX_COVERS) {
                fetchedUrls = appendCandidates(
                    fetchedUrls,
                    await fetchOpenLibrarySearchCovers()
                );
            }

            if (fetchedUrls.length > 0) {
                setCoverUris((prev) => toLimitedUniqueUrls([...prev, ...fetchedUrls]));
                setNewImagesSelected(true);
                onSuccess("Book cover(s) fetched successfully!");
                return;
            }

            onError("No cover found. Please upload manually.");
        } catch (error) {
            console.log("Cover fetch failed", error);
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
