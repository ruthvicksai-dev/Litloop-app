import { BookMetadata, fetchBookMetadata } from "@/utils/bookMetadata";
import { sanitizeFetchedDescription } from "@/utils/descriptionPolicy";

type GoogleBooksItem = {
    volumeInfo?: {
        publishedDate?: string;
        publisher?: string;
        pageCount?: number;
    };
};

type GoogleBooksResponse = {
    items?: GoogleBooksItem[];
};

type OpenLibraryDoc = {
    first_publish_year?: number;
    publish_year?: number[];
    publisher?: string[];
    number_of_pages_median?: number;
};

type OpenLibraryResponse = {
    docs?: OpenLibraryDoc[];
};

export type BookMetadataExtended = BookMetadata & {
    publisher?: string;
    pageCount?: number;
    descriptionRejectedReason?: string;
};

function getPublishedYear(value?: string) {
    if (!value) return "";
    const match = value.match(/\b\d{4}\b/);
    return match?.[0] || value;
}

async function fetchGoogleBooksExtras(title: string, author?: string) {
    const titleQuery = encodeURIComponent(title.trim());
    const authorQuery = author?.trim()
        ? `+inauthor:${encodeURIComponent(author.trim())}`
        : "";

    const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${titleQuery}${authorQuery}`
    );

    if (!response.ok) {
        throw new Error("Google Books request failed.");
    }

    const data = (await response.json()) as GoogleBooksResponse;
    const info = data.items?.[0]?.volumeInfo;
    return {
        publishedYear: getPublishedYear(info?.publishedDate),
        publisher: info?.publisher?.trim() || "",
        pageCount: typeof info?.pageCount === "number" ? info.pageCount : undefined,
    };
}

function getOpenLibraryPublishedYear(doc?: OpenLibraryDoc) {
    if (!doc) return "";
    if (typeof doc.first_publish_year === "number") return String(doc.first_publish_year);
    const years = doc.publish_year?.filter((year) => typeof year === "number") ?? [];
    if (years.length === 0) return "";
    return String(Math.min(...years));
}

function getOpenLibraryPublisher(doc?: OpenLibraryDoc) {
    const value = doc?.publisher?.[0]?.trim() || "";
    return value;
}

function getOpenLibraryPageCount(doc?: OpenLibraryDoc) {
    const value = doc?.number_of_pages_median;
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

async function fetchOpenLibraryExtras(title: string, author?: string) {
    const titleQuery = `title=${encodeURIComponent(title.trim())}`;
    const authorQuery = author?.trim()
        ? `&author=${encodeURIComponent(author.trim())}`
        : "";

    const response = await fetch(
        `https://openlibrary.org/search.json?${titleQuery}${authorQuery}`
    );

    if (!response.ok) {
        throw new Error("OpenLibrary request failed.");
    }

    const data = (await response.json()) as OpenLibraryResponse;
    const doc = data.docs?.[0];
    return {
        publishedYear: getOpenLibraryPublishedYear(doc),
        publisher: getOpenLibraryPublisher(doc),
        pageCount: getOpenLibraryPageCount(doc),
    };
}

export async function fetchBookMetadataExtended(
    title: string,
    author?: string
): Promise<BookMetadataExtended> {
    const base = await fetchBookMetadata(title, author);
    const safeDescriptionResult = sanitizeFetchedDescription(base.description);

    const [googleResult, openLibraryResult] = await Promise.allSettled([
        fetchGoogleBooksExtras(title, author),
        fetchOpenLibraryExtras(title, author),
    ]);

    const googleExtras = googleResult.status === "fulfilled" ? googleResult.value : undefined;
    const openLibraryExtras =
        openLibraryResult.status === "fulfilled" ? openLibraryResult.value : undefined;

    const publishedYear =
        base.publishedYear ||
        googleExtras?.publishedYear ||
        openLibraryExtras?.publishedYear ||
        "";

    const publisher =
        googleExtras?.publisher ||
        openLibraryExtras?.publisher ||
        "";

    const pageCount =
        googleExtras?.pageCount ?? openLibraryExtras?.pageCount;

    return {
        ...base,
        description: safeDescriptionResult.description,
        descriptionRejectedReason: safeDescriptionResult.rejectedReason,
        publishedYear,
        publisher: publisher ? publisher : undefined,
        pageCount,
    };
}
