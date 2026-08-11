import { fetchWithRetry } from "./fetchUtils";
import {
    cleanDescriptionText,
    extractMainGenres,
    getPublishedYear,
    sanitizeFetchedDescription,
} from "./normalize";

const USER_AGENT = "LitLoop/1.0 (support@litloop.in)";

type OpenLibraryIsbnResponse = {
    title?: string;
    authors?: Array<{ key?: string }>;
    by_statement?: string;
    number_of_pages?: number;
    publishers?: string[];
    publish_date?: string;
    works?: Array<{ key?: string }>;
    subjects?: string[];
    isbn_10?: string[];
    isbn_13?: string[];
};

type OpenLibraryAuthorResponse = {
    name?: string;
    personal_name?: string;
};

type OpenLibraryWorkResponse = {
    title?: string;
    description?: string | { value?: string };
    subjects?: string[];
    first_sentence?: string | string[] | { value?: string };
};

type OpenLibraryEditionsResponse = {
    entries?: Array<{
        number_of_pages?: number;
        publishers?: string[];
    }>;
};

type OpenLibrarySearchDoc = {
    title?: string;
    author_name?: string[];
    first_publish_year?: number;
    first_sentence?: string | string[] | { value?: string };
    publisher?: string[];
    number_of_pages_median?: number;
    subject?: string[];
    isbn?: string[];
    key?: string;
};

type OpenLibrarySearchResponse = {
    docs?: OpenLibrarySearchDoc[];
};

export type RawOpenLibraryResult = {
    title?: string;
    author?: string;
    description?: string;
    descriptionRejectedReason?: string;
    genres: string[];
    publishedYear: string;
    publisher?: string;
    pageCount?: number;
    isbn10?: string;
    isbn13?: string;
    workKey?: string;
};

/**
 * Open Library metadata fetcher by ISBN.
 * Uses User-Agent: LitLoop/1.0 (support@litloop.in).
 * Dynamically issues secondary requests ONLY when fields are missing.
 */
export async function fetchOpenLibraryMetadata(isbn: string): Promise<RawOpenLibraryResult | null> {
    const headers = { "User-Agent": USER_AGENT, Accept: "application/json" };
    const url = `https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`;

    const response = await fetchWithRetry(url, { headers }, 20000);

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`Open Library API returned HTTP ${response.status}`);
    }

    const edition: OpenLibraryIsbnResponse = await response.json();

    let title = edition.title?.trim();
    let author = edition.by_statement?.trim();
    let publisher = edition.publishers?.[0]?.trim();
    let pageCount = edition.number_of_pages;
    let publishedYear = getPublishedYear(edition.publish_date);
    let description = "";
    let descriptionRejectedReason: string | undefined;
    let genres: string[] = extractMainGenres(edition.subjects);

    const workKey = edition.works?.[0]?.key;
    const authorKey = edition.authors?.[0]?.key;

    // 1. Author resolution: if author statement missing, call author key
    if (!author && authorKey) {
        try {
            const authorUrl = `https://openlibrary.org${authorKey}.json`;
            const authorRes = await fetchWithRetry(authorUrl, { headers }, 15000);
            if (authorRes.ok) {
                const authorData: OpenLibraryAuthorResponse = await authorRes.json();
                author = authorData.name?.trim() || authorData.personal_name?.trim();
            }
        } catch {
            // Non-critical secondary request
        }
    }

    // 2. Work resolution: if description or genres missing, call work key
    if (workKey && (!description || genres.length === 0 || !title)) {
        try {
            const workUrl = `https://openlibrary.org${workKey}.json`;
            const workRes = await fetchWithRetry(workUrl, { headers }, 15000);
            if (workRes.ok) {
                const workData: OpenLibraryWorkResponse = await workRes.json();

                if (!title && workData.title) {
                    title = workData.title.trim();
                }

                if (genres.length === 0 && workData.subjects) {
                    genres = extractMainGenres(workData.subjects);
                }

                let rawDesc = "";
                if (typeof workData.description === "string") {
                    rawDesc = workData.description;
                } else if (workData.description && typeof workData.description.value === "string") {
                    rawDesc = workData.description.value;
                } else if (workData.first_sentence) {
                    if (typeof workData.first_sentence === "string") {
                        rawDesc = workData.first_sentence;
                    } else if (Array.isArray(workData.first_sentence) && workData.first_sentence.length > 0) {
                        rawDesc = workData.first_sentence[0];
                    } else if (
                        typeof workData.first_sentence === "object" &&
                        !Array.isArray(workData.first_sentence) &&
                        typeof (workData.first_sentence as { value?: string }).value === "string"
                    ) {
                        rawDesc = (workData.first_sentence as { value?: string }).value || "";
                    }
                }

                if (rawDesc) {
                    const sanitized = sanitizeFetchedDescription(rawDesc);
                    description = sanitized.description;
                    descriptionRejectedReason = sanitized.rejectedReason;
                }
            }
        } catch {
            // Non-critical secondary request
        }
    }

    // 3. Editions resolution: if publisher or page count still missing and workKey present
    if (workKey && (!publisher || !pageCount)) {
        try {
            const editionsUrl = `https://openlibrary.org${workKey}/editions.json?limit=10`;
            const editionsRes = await fetchWithRetry(editionsUrl, { headers }, 15000);
            if (editionsRes.ok) {
                const editionsData: OpenLibraryEditionsResponse = await editionsRes.json();
                if (editionsData.entries && editionsData.entries.length > 0) {
                    for (const entry of editionsData.entries) {
                        if (!publisher && entry.publishers && entry.publishers.length > 0) {
                            publisher = entry.publishers[0].trim();
                        }
                        if (!pageCount && entry.number_of_pages) {
                            pageCount = entry.number_of_pages;
                        }
                        if (publisher && pageCount) break;
                    }
                }
            }
        } catch {
            // Non-critical secondary request
        }
    }

    const isbn10 = edition.isbn_10?.[0];
    const isbn13 = edition.isbn_13?.[0];

    return {
        title,
        author: author || "Unknown Author",
        description,
        descriptionRejectedReason,
        genres,
        publishedYear,
        publisher,
        pageCount,
        isbn10,
        isbn13,
        workKey,
    };
}

/**
 * Open Library metadata fetcher by Title and optional Author.
 * Used when an admin enters title/author directly without an ISBN.
 */
export async function fetchOpenLibraryMetadataBySearch(
    titleQuery: string,
    authorQuery?: string
): Promise<RawOpenLibraryResult | null> {
    const headers = { "User-Agent": USER_AGENT, Accept: "application/json" };
    const params = new URLSearchParams();
    if (titleQuery.trim()) params.append("title", titleQuery.trim());
    if (authorQuery && authorQuery.trim()) params.append("author", authorQuery.trim());

    const url = `https://openlibrary.org/search.json?${params.toString()}`;
    const response = await fetchWithRetry(url, { headers }, 20000);

    if (!response.ok) return null;

    const data: OpenLibrarySearchResponse = await response.json();
    if (!data.docs || data.docs.length === 0) return null;

    const doc = data.docs[0];
    const foundIsbn = doc.isbn?.find((i) => i.length === 13 || i.length === 10) || doc.isbn?.[0];

    if (foundIsbn) {
        try {
            const richMetadata = await fetchOpenLibraryMetadata(foundIsbn);
            if (richMetadata) return richMetadata;
        } catch {
            // Fall back to doc parsing below
        }
    }

    const title = doc.title?.trim() || titleQuery.trim();
    const author = doc.author_name?.[0]?.trim() || authorQuery?.trim() || "Unknown Author";
    let publisher = doc.publisher?.[0]?.trim();
    let pageCount = doc.number_of_pages_median;
    const publishedYear = doc.first_publish_year ? String(doc.first_publish_year) : "";
    let genres = extractMainGenres(doc.subject);
    let description = "";
    let descriptionRejectedReason: string | undefined;

    const workKey = doc.key;

    // Fetch work details if available to populate description & genres
    if (workKey) {
        try {
            const workUrl = `https://openlibrary.org${workKey}.json`;
            const workRes = await fetchWithRetry(workUrl, { headers }, 15000);
            if (workRes.ok) {
                const workData: OpenLibraryWorkResponse = await workRes.json();

                if (genres.length === 0 && workData.subjects) {
                    genres = extractMainGenres(workData.subjects);
                }

                let rawDesc = "";
                if (typeof workData.description === "string") {
                    rawDesc = workData.description;
                } else if (workData.description && typeof workData.description.value === "string") {
                    rawDesc = workData.description.value;
                } else if (workData.first_sentence) {
                    if (typeof workData.first_sentence === "string") {
                        rawDesc = workData.first_sentence;
                    } else if (Array.isArray(workData.first_sentence) && workData.first_sentence.length > 0) {
                        rawDesc = workData.first_sentence[0];
                    } else if (
                        typeof workData.first_sentence === "object" &&
                        !Array.isArray(workData.first_sentence) &&
                        typeof (workData.first_sentence as { value?: string }).value === "string"
                    ) {
                        rawDesc = (workData.first_sentence as { value?: string }).value || "";
                    }
                }

                if (rawDesc) {
                    const sanitized = sanitizeFetchedDescription(rawDesc);
                    description = sanitized.description;
                    descriptionRejectedReason = sanitized.rejectedReason;
                }
            }
        } catch {
            // Non-critical secondary request
        }
    }

    return {
        title,
        author,
        description,
        descriptionRejectedReason,
        genres,
        publishedYear,
        publisher,
        pageCount,
        isbn13: foundIsbn && foundIsbn.length === 13 ? foundIsbn : undefined,
        isbn10: foundIsbn && foundIsbn.length === 10 ? foundIsbn : undefined,
        workKey,
    };
}
