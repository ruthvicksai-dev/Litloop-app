import { useState } from "react";
import * as ImagePicker from "expo-image-picker";

type UseBookCoverManagerOptions = {
    title: string;
    author: string;
    initialCoverUris?: string[];
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
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

    const fetchCover = async () => {
        if (!title.trim()) {
            onError("Please enter a title to fetch cover.");
            return;
        }

        setIsFetchingCover(true);
        try {
            const query = `intitle:${encodeURIComponent(title.trim())}`;
            const authorQuery = author.trim()
                ? `+inauthor:${encodeURIComponent(author.trim())}`
                : "";
            const url = `https://www.googleapis.com/books/v1/volumes?q=${query}${authorQuery}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                const bookInfo = data.items[0].volumeInfo;

                let isbn = "";
                if (bookInfo.industryIdentifiers) {
                    const isbn13 = bookInfo.industryIdentifiers.find(
                        (identifier: { type: string; identifier: string }) =>
                            identifier.type === "ISBN_13"
                    );
                    const isbn10 = bookInfo.industryIdentifiers.find(
                        (identifier: { type: string; identifier: string }) =>
                            identifier.type === "ISBN_10"
                    );
                    isbn = isbn13?.identifier || isbn10?.identifier || "";
                }

                let urls: string[] = [];
                let hasHDCovers = false;

                if (isbn) {
                    const testUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`;
                    try {
                        const res = await fetch(testUrl);
                        if (res.ok) {
                            urls = [
                                `https://covers.openlibrary.org/b/isbn/${isbn}-S.jpg`,
                                `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
                                `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
                            ];
                            hasHDCovers = true;
                        }
                    } catch (error) {
                        console.log("OpenLibrary cover fetch skipped", error);
                    }
                }

                if (!hasHDCovers && bookInfo?.imageLinks) {
                    let thumbUrl =
                        bookInfo.imageLinks.thumbnail ||
                        bookInfo.imageLinks.smallThumbnail;
                    if (thumbUrl) {
                        thumbUrl = thumbUrl.replace(/^http:\/\//i, "https://");
                        urls = [thumbUrl];
                    }
                }

                if (urls.length > 0) {
                    setCoverUris(urls);
                    setNewImagesSelected(true);
                    onSuccess("Book cover(s) fetched successfully!");
                    return;
                }
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
            quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
            setCoverUris(result.assets.map((asset) => asset.uri));
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
