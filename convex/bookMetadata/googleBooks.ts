import { fetchWithTimeout } from "./fetchUtils";
import {
    cleanDescriptionText,
    extractMainGenres,
    getPublishedYear,
    sanitizeFetchedDescription,
} from "./normalize";
import { RawOpenLibraryResult } from "./openLibrary";

const USER_AGENT = "LitLoop/1.0 (support@litloop.in)";

type GoogleBooksVolume = {
    volumeInfo?: {
        title?: string;
        authors?: string[];
        publisher?: string;
        publishedDate?: string;
        description?: string;
        industryIdentifiers?: Array<{
            type?: string;
            identifier?: string;
        }>;
        pageCount?: number;
        categories?: string[];
        imageLinks?: {
            thumbnail?: string;
            smallThumbnail?: string;
        };
    };
};

type GoogleBooksSearchResponse = {
    totalItems?: number;
    items?: GoogleBooksVolume[];
};

/**
 * Builds the Google Books API base URL with optional API key.
 */
function buildGoogleBooksUrl(queryParams: URLSearchParams): string {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    if (apiKey) {
        queryParams.append("key", apiKey);
    }
    return `https://www.googleapis.com/books/v1/volumes?${queryParams.toString()}`;
}

/**
 * Extracts ISBNs from Google Books industryIdentifiers.
 */
function extractIsbns(identifiers?: Array<{ type?: string; identifier?: string }>): {
    isbn10?: string;
    isbn13?: string;
} {
    if (!identifiers) return {};
    let isbn10: string | undefined;
    let isbn13: string | undefined;

    for (const id of identifiers) {
        if (id.type === "ISBN_13" && id.identifier) {
            isbn13 = id.identifier;
        } else if (id.type === "ISBN_10" && id.identifier) {
            isbn10 = id.identifier;
        }
    }
    return { isbn10, isbn13 };
}

/**
 * Converts a Google Books volume into the shared RawOpenLibraryResult format.
 */
function volumeToRawResult(volume: GoogleBooksVolume): RawOpenLibraryResult | null {
    const info = volume.volumeInfo;
    if (!info || !info.title) return null;

    const { isbn10, isbn13 } = extractIsbns(info.industryIdentifiers);
    const genres = extractMainGenres(info.categories);
    const publishedYear = getPublishedYear(info.publishedDate);

    let description = "";
    let descriptionRejectedReason: string | undefined;

    if (info.description) {
        const cleaned = cleanDescriptionText(info.description);
        const sanitized = sanitizeFetchedDescription(cleaned);
        description = sanitized.description;
        descriptionRejectedReason = sanitized.rejectedReason;
    }

    return {
        title: info.title.trim(),
        author: info.authors?.[0]?.trim() || "Unknown Author",
        description,
        descriptionRejectedReason,
        genres,
        publishedYear,
        publisher: info.publisher?.trim(),
        pageCount: info.pageCount,
        isbn10,
        isbn13,
    };
}

/**
 * Google Books metadata fetcher by ISBN.
 * Free tier: 1000 req/day without API key, more with key.
 */
export async function fetchGoogleBooksMetadata(isbn: string): Promise<RawOpenLibraryResult | null> {
    const headers = { "User-Agent": USER_AGENT, Accept: "application/json" };
    const params = new URLSearchParams({
        q: `isbn:${isbn}`,
        maxResults: "1",
        printType: "books",
    });

    const url = buildGoogleBooksUrl(params);

    try {
        const response = await fetchWithTimeout(url, { headers }, 20000);

        if (response.status === 429) {
            console.warn("[GoogleBooks] Rate limited (429). Skipping.");
            return null;
        }
        if (!response.ok) return null;

        const data: GoogleBooksSearchResponse = await response.json();
        if (!data.items || data.items.length === 0) return null;

        return volumeToRawResult(data.items[0]);
    } catch (error: any) {
        console.warn("[GoogleBooks] ISBN lookup failed:", error.message);
        return null;
    }
}

/**
 * Google Books metadata fetcher by Title and optional Author.
 * Used as fallback when Open Library search also fails.
 */
export async function fetchGoogleBooksMetadataBySearch(
    titleQuery: string,
    authorQuery?: string
): Promise<RawOpenLibraryResult | null> {
    const headers = { "User-Agent": USER_AGENT, Accept: "application/json" };

    let q = `intitle:${titleQuery.trim()}`;
    if (authorQuery && authorQuery.trim()) {
        q += `+inauthor:${authorQuery.trim()}`;
    }

    const params = new URLSearchParams({
        q,
        maxResults: "3",
        printType: "books",
        orderBy: "relevance",
    });

    const url = buildGoogleBooksUrl(params);

    try {
        const response = await fetchWithTimeout(url, { headers }, 20000);

        if (response.status === 429) {
            console.warn("[GoogleBooks] Rate limited (429). Skipping.");
            return null;
        }
        if (!response.ok) return null;

        const data: GoogleBooksSearchResponse = await response.json();
        if (!data.items || data.items.length === 0) return null;

        // Try each result until we find one with a valid title
        for (const item of data.items) {
            const result = volumeToRawResult(item);
            if (result && result.title) return result;
        }

        return null;
    } catch (error: any) {
        console.warn("[GoogleBooks] Title search failed:", error.message);
        return null;
    }
}
