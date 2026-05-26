import { MAIN_GENRES } from "@/constants/mainGenres";
import { sanitizeFetchedDescription } from "@/utils/book/display";

const MAX_MAIN_GENRES = 3;

export type BookMetadata = {
    title?: string;
    author: string;
    description: string;
    genres: string[];
    publishedYear: string;
    isbn?: string;
};

export type BookMetadataExtended = BookMetadata & {
    publisher?: string;
    pageCount?: number;
    descriptionRejectedReason?: string;
};

type GoogleBooksVolumeInfo = {
    authors?: string[];
    categories?: string[];
    description?: string;
    industryIdentifiers?: Array<{
        type: string;
        identifier: string;
    }>;
    pageCount?: number;
    publishedDate?: string;
    publisher?: string;
    title?: string;
};

type GoogleBooksResponse = {
    items?: Array<{
        volumeInfo?: GoogleBooksVolumeInfo;
    }>;
};

type OpenLibraryResponse = {
    docs?: Array<{
        author_name?: string[];
        first_publish_year?: number;
        first_sentence?: string | string[];
        key?: string;
        number_of_pages_median?: number;
        publisher?: string[];
        subject?: string[];
    }>;
};

type OpenLibraryIsbnResponse = {
    authors?: Array<{ key?: string }>;
    by_statement?: string;
    number_of_pages?: number;
    publishers?: string[];
    publish_date?: string;
    title?: string;
    works?: Array<{ key?: string }>;
};

type OpenLibraryAuthorResponse = {
    name?: string;
    personal_name?: string;
};

type OpenLibraryWorkResponse = {
    description?: string | { value?: string };
    subjects?: string[];
    title?: string;
};

type OpenLibraryEditionsResponse = {
    entries?: Array<{
        number_of_pages?: number;
        publishers?: string[];
    }>;
};

const GENRE_LOOKUP = new Map(
    MAIN_GENRES.map((genre) => [genre.toLowerCase(), genre])
);

const GENRE_ALIASES: Array<{ match: string; genre: string }> = [
    { match: "action", genre: "Action" },
    { match: "adventure", genre: "Adventure" },
    { match: "thriller", genre: "Thriller" },
    { match: "suspense", genre: "Thriller" },
    { match: "mystery", genre: "Mystery" },
    { match: "detective", genre: "Mystery" },
    { match: "crime", genre: "Mystery" },
    { match: "romance", genre: "Romance" },
    { match: "love story", genre: "Romance" },
    { match: "contemporary romance", genre: "Romance" },
    { match: "contemporary fiction", genre: "Romance" },
    { match: "fiction", genre: "Romance" },
    { match: "fantasy", genre: "Fantasy" },
    { match: "science fiction", genre: "Sci-Fi" },
    { match: "sci-fi", genre: "Sci-Fi" },
    { match: "scifi", genre: "Sci-Fi" },
    { match: "horror", genre: "Horror" },
    { match: "biography", genre: "Biography" },
    { match: "memoir", genre: "Biography" },
    { match: "autobiography", genre: "Biography" },
    { match: "self-help", genre: "Self Help" },
    { match: "self help", genre: "Self Help" },
    { match: "personal development", genre: "Self Help" },
    { match: "psychology", genre: "Self Help" },
    { match: "history", genre: "History" },
    { match: "education", genre: "Education" },
    { match: "study", genre: "Education" },
    { match: "academic", genre: "Education" },
    { match: "learning", genre: "Education" },
    { match: "business", genre: "Business" },
    { match: "economics", genre: "Business" },
    { match: "finance", genre: "Business" },
    { match: "marketing", genre: "Business" },
    { match: "psychology", genre: "Psychology" },
];

function cleanGenrePart(value: string) {
    return value
        .toLowerCase()
        .replace(/[()]/g, " ")
        .replace(/&/g, " and ")
        .replace(/-/g, " ")
        .replace(/[^a-z0-9/,\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function splitGenreValue(value: string) {
    return cleanGenrePart(value)
        .split(/[\/,]/)
        .map((part) => part.trim())
        .filter(Boolean);
}

export function cleanDescriptionText(description: string) {
    return description
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/\s+/g, " ")
        .trim();
}

export function extractMainGenres(rawGenres: string[]) {
    const normalized = new Set<string>();

    rawGenres.forEach((rawGenre) => {
        splitGenreValue(rawGenre).forEach((part) => {
            const exactMatch = GENRE_LOOKUP.get(part);
            if (exactMatch) {
                normalized.add(exactMatch);
                return;
            }

            const aliasMatch = GENRE_ALIASES.find(({ match }) => part.includes(match));
            if (aliasMatch) {
                normalized.add(aliasMatch.genre);
                return;
            }
        });
    });

    return Array.from(normalized).slice(0, MAX_MAIN_GENRES);
}

function getPublishedYear(value?: string) {
    if (!value) return "";
    const match = value.match(/\b\d{4}\b/);
    return match?.[0] || value;
}

function normalizeIsbn(value?: string) {
    return value?.replace(/[-\s]/g, "").trim().toUpperCase() || "";
}

function getGoogleIsbn(info?: GoogleBooksVolumeInfo) {
    const identifiers = info?.industryIdentifiers || [];
    const isbn13 = identifiers.find((identifier) => identifier.type === "ISBN_13");
    const isbn10 = identifiers.find((identifier) => identifier.type === "ISBN_10");
    return isbn13?.identifier || isbn10?.identifier || "";
}

// Internal Fetchers
async function fetchWithRetry(url: string, retries = 3, backoff = 1000): Promise<Response> {
    let lastError: unknown;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) return response;
            if (response.status !== 429 && response.status < 500) {
                // Don't retry client errors like 400, 401, 403, 404
                return response;
            }
            // If it's 429 or 5xx, we'll fall through to the retry delay
            lastError = new Error(`HTTP Error: ${response.status}`);
        } catch (error) {
            // Network error (e.g. disconnected) — catch and retry
            lastError = error;
        }

        if (i < retries - 1) {
            await new Promise((res) => setTimeout(res, backoff * (i + 1)));
        }
    }
    
    throw lastError || new Error("Fetch failed after retries.");
}

async function fetchGoogleBooks(title: string, author?: string): Promise<GoogleBooksResponse> {
    const titleQuery = encodeURIComponent(title.trim());
    const authorQuery = author?.trim() ? `+inauthor:${encodeURIComponent(author.trim())}` : "";
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;
    const authParam = apiKey ? `&key=${apiKey}` : "";
    
    const response = await fetchWithRetry(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${titleQuery}${authorQuery}${authParam}`
    );
    if (!response.ok) throw new Error(`Google Books request failed with status: ${response.status}`);
    return (await response.json()) as GoogleBooksResponse;
}

async function fetchGoogleBooksByIsbn(isbn: string): Promise<GoogleBooksResponse> {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;
    const authParam = apiKey ? `&key=${apiKey}` : "";
    
    const response = await fetchWithRetry(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}${authParam}`
    );
    if (!response.ok) throw new Error(`Google Books ISBN request failed with status: ${response.status}`);
    return (await response.json()) as GoogleBooksResponse;
}

async function fetchOpenLibrary(title: string, author?: string): Promise<OpenLibraryResponse> {
    const titleQuery = `title=${encodeURIComponent(title.trim())}`;
    const authorQuery = author?.trim() ? `&author=${encodeURIComponent(author.trim())}` : "";
    const response = await fetch(`https://openlibrary.org/search.json?${titleQuery}${authorQuery}`);
    if (!response.ok) throw new Error("OpenLibrary request failed.");
    return (await response.json()) as OpenLibraryResponse;
}

async function fetchOpenLibraryByIsbn(isbn: string): Promise<OpenLibraryIsbnResponse> {
    const response = await fetch(`https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`);
    if (!response.ok) throw new Error("OpenLibrary ISBN request failed.");
    return (await response.json()) as OpenLibraryIsbnResponse;
}

async function fetchOpenLibraryAuthor(key: string): Promise<OpenLibraryAuthorResponse> {
    const response = await fetch(`https://openlibrary.org${key}.json`);
    if (!response.ok) throw new Error("OpenLibrary author request failed.");
    return (await response.json()) as OpenLibraryAuthorResponse;
}

async function fetchOpenLibraryWork(key: string): Promise<OpenLibraryWorkResponse> {
    const response = await fetch(`https://openlibrary.org${key}.json`);
    if (!response.ok) throw new Error("OpenLibrary work request failed.");
    return (await response.json()) as OpenLibraryWorkResponse;
}

async function fetchOpenLibraryEditions(key: string): Promise<OpenLibraryEditionsResponse> {
    const response = await fetch(`https://openlibrary.org${key}/editions.json?limit=10`);
    if (!response.ok) throw new Error("OpenLibrary editions request failed.");
    return (await response.json()) as OpenLibraryEditionsResponse;
}

function getOpenLibraryWorkKeyFromIsbn(data?: OpenLibraryIsbnResponse) {
    return data?.works?.[0]?.key || "";
}

function getOpenLibraryDescription(value?: string | string[]) {
    if (Array.isArray(value)) {
        return value[0] || "";
    }
    return value || "";
}

function getOpenLibraryWorkDescription(value?: OpenLibraryWorkResponse["description"]) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value.value || "";
}

function findGoogleBookInfoWithEditionDetails(data?: GoogleBooksResponse) {
    return data?.items
        ?.map((item) => item.volumeInfo)
        .find((info) => Boolean(info?.publisher?.trim()) || typeof info?.pageCount === "number");
}

function getOpenLibraryEditionPublisher(data?: OpenLibraryEditionsResponse) {
    return (
        data?.entries
            ?.flatMap((entry) => entry.publishers || [])
            .find((publisher) => publisher.trim())
            ?.trim() || ""
    );
}

function getOpenLibraryEditionPageCount(data?: OpenLibraryEditionsResponse) {
    return data?.entries?.find(
        (entry) => typeof entry.number_of_pages === "number" && entry.number_of_pages > 0
    )?.number_of_pages;
}

function getOpenLibraryAuthorStatement(value?: string) {
    return value?.replace(/^by\s+/i, "").trim() || "";
}

async function getOpenLibraryIsbnAuthor(data?: OpenLibraryIsbnResponse) {
    const authorStatement = getOpenLibraryAuthorStatement(data?.by_statement);
    if (authorStatement) {
        return authorStatement;
    }

    const authorKey = data?.authors?.find((author) => author.key)?.key;
    if (!authorKey) {
        return "";
    }

    try {
        const author = await fetchOpenLibraryAuthor(authorKey);
        return author.name?.trim() || author.personal_name?.trim() || "";
    } catch (error) {
        console.log("OpenLibrary author lookup skipped", error);
        return "";
    }
}

async function fetchBookMetadataWithGoogleInfo(title: string, author?: string, isbn?: string) {
    const normalizedIsbn = normalizeIsbn(isbn);
    if (!normalizedIsbn && !title.trim()) throw new Error("Title is required.");

    let googleData: GoogleBooksResponse | undefined;
    let googleError: unknown;
    let usedIsbnLookup = false;

    if (normalizedIsbn) {
        try {
            googleData = await fetchGoogleBooksByIsbn(normalizedIsbn);
            usedIsbnLookup = Boolean(googleData.items?.length);
        } catch (error) {
            googleError = error;
        }
    }

    if (!googleData?.items?.length && title.trim()) {
        try {
            googleData = await fetchGoogleBooks(title, author);
        } catch (error) {
            googleError = error;
        }
    }

    const googleBookInfo = googleData?.items?.[0]?.volumeInfo;
    const googleEditionInfo = findGoogleBookInfoWithEditionDetails(googleData) || googleBookInfo;
    const googleDescription = cleanDescriptionText(googleBookInfo?.description || "");
    const googleGenres = extractMainGenres(googleBookInfo?.categories || []);
    const googleAuthor = googleBookInfo?.authors?.[0]?.trim() || "";
    const googlePublishedYear = getPublishedYear(googleBookInfo?.publishedDate);
    const googlePublisher = googleEditionInfo?.publisher?.trim() || "";
    const googlePageCount =
        typeof googleEditionInfo?.pageCount === "number" ? googleEditionInfo.pageCount : undefined;
    const googleTitle = googleBookInfo?.title?.trim() || "";
    const googleIsbn = getGoogleIsbn(googleBookInfo);

    let openLibraryData: OpenLibraryResponse | undefined;
    let openLibraryIsbnData: OpenLibraryIsbnResponse | undefined;
    let openLibraryWorkData: OpenLibraryWorkResponse | undefined;
    let openLibraryEditionsData: OpenLibraryEditionsResponse | undefined;
    let openLibraryError: unknown;
    if (!googleDescription || googleGenres.length === 0 || !googlePublisher || !googlePageCount || !googleAuthor) {
        try {
            let openLibraryWorkKey = "";
            if (normalizedIsbn) {
                try {
                    openLibraryIsbnData = await fetchOpenLibraryByIsbn(normalizedIsbn);
                    openLibraryWorkKey = getOpenLibraryWorkKeyFromIsbn(openLibraryIsbnData);
                } catch (error) {
                    console.log("OpenLibrary ISBN metadata lookup skipped", error);
                }
            }

            if (!openLibraryWorkKey && title.trim()) {
                openLibraryData = await fetchOpenLibrary(title, author);
                openLibraryWorkKey = openLibraryData.docs?.[0]?.key || "";
            }

            if (openLibraryWorkKey) {
                openLibraryWorkData = await fetchOpenLibraryWork(openLibraryWorkKey);
                openLibraryEditionsData = await fetchOpenLibraryEditions(openLibraryWorkKey);
            }
        } catch (error) {
            openLibraryError = error;
        }
    }

    const openLibraryDoc = openLibraryData?.docs?.[0];
    const openLibraryDescription = cleanDescriptionText(
        getOpenLibraryDescription(openLibraryDoc?.first_sentence) ||
            getOpenLibraryWorkDescription(openLibraryWorkData?.description)
    );
    const openLibraryGenres = extractMainGenres([
        ...(openLibraryDoc?.subject || []),
        ...(openLibraryWorkData?.subjects || []),
    ]);
    const openLibraryIsbnAuthor = await getOpenLibraryIsbnAuthor(openLibraryIsbnData);
    const metadata = {
        title: googleTitle || openLibraryIsbnData?.title?.trim() || openLibraryWorkData?.title?.trim() || "",
        author:
            googleAuthor ||
            openLibraryDoc?.author_name?.[0]?.trim() ||
            openLibraryIsbnAuthor,
        description: googleDescription || openLibraryDescription,
        genres:
            googleGenres.length > 0
                ? googleGenres
                : openLibraryGenres,
        publishedYear:
            googlePublishedYear ||
            getPublishedYear(openLibraryIsbnData?.publish_date) ||
            String(openLibraryDoc?.first_publish_year || ""),
        isbn: googleIsbn || normalizedIsbn || undefined,
    };

    const hasAnyMetadata =
        Boolean(metadata.title) ||
        Boolean(metadata.author) ||
        Boolean(metadata.description) ||
        metadata.genres.length > 0 ||
        Boolean(metadata.publishedYear);

    if (!hasAnyMetadata && googleError && openLibraryError) {
        throw new Error("Failed to fetch book info. Please check your connection and try again.");
    }

    if (!hasAnyMetadata && googleError) {
        const errorMsg = googleError instanceof Error ? googleError.message : "";
        if (errorMsg.includes("429")) {
            throw new Error(
                "API rate limit exceeded and book not found in fallback database. Please try again later or enter manually."
            );
        }
        throw googleError instanceof Error
            ? googleError
            : new Error("Google Books request failed.");
    }

    if (!hasAnyMetadata) {
        throw new Error("No book info found. Try another method with title and author.");
    }

    const fallbackPublisher = openLibraryDoc?.publisher?.[0]?.trim() || "";
    const isbnPublisher = openLibraryIsbnData?.publishers?.[0]?.trim() || "";
    const fallbackPageCount =
        typeof openLibraryIsbnData?.number_of_pages === "number"
            ? openLibraryIsbnData.number_of_pages
            : typeof openLibraryDoc?.number_of_pages_median === "number"
            ? openLibraryDoc.number_of_pages_median
            : getOpenLibraryEditionPageCount(openLibraryEditionsData);
    const editionPublisher = getOpenLibraryEditionPublisher(openLibraryEditionsData);

    return {
        metadata,
        googleBookInfo,
        googlePublisher,
        googlePageCount,
        fallbackPublisher: isbnPublisher || fallbackPublisher || editionPublisher,
        fallbackPageCount,
        usedIsbnLookup,
    };
}

export async function fetchBookMetadata(
    title: string,
    author?: string,
    isbn?: string
): Promise<BookMetadata> {
    const { metadata } = await fetchBookMetadataWithGoogleInfo(title, author, isbn);
    return metadata;
}

export async function fetchBookMetadataExtended(
    title: string,
    author?: string,
    isbn?: string
): Promise<BookMetadataExtended> {
    const {
        metadata: base,
        googlePublisher,
        googlePageCount,
        fallbackPublisher,
        fallbackPageCount,
    } = await fetchBookMetadataWithGoogleInfo(title, author, isbn);
    const safeDescriptionResult = sanitizeFetchedDescription(base.description);

    const publisher = googlePublisher || fallbackPublisher || "";
    const pageCount = googlePageCount || fallbackPageCount;

    return {
        ...base,
        description: safeDescriptionResult.description,
        descriptionRejectedReason: safeDescriptionResult.rejectedReason,
        publisher: publisher || undefined,
        pageCount,
    };
}
