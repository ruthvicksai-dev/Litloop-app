import { MAIN_GENRES } from "@/constants/mainGenres";
import { sanitizeFetchedDescription } from "@/utils/book/display";

const MAX_MAIN_GENRES = 3;

export type BookMetadata = {
    author: string;
    description: string;
    genres: string[];
    publishedYear: string;
};

export type BookMetadataExtended = BookMetadata & {
    publisher?: string;
    pageCount?: number;
    descriptionRejectedReason?: string;
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

// Internal Fetchers
async function fetchGoogleBooks(title: string, author?: string) {
    const titleQuery = encodeURIComponent(title.trim());
    const authorQuery = author?.trim() ? `+inauthor:${encodeURIComponent(author.trim())}` : "";
    const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${titleQuery}${authorQuery}`
    );
    if (!response.ok) throw new Error("Google Books request failed.");
    return await response.json();
}

async function fetchOpenLibrary(title: string, author?: string) {
    const titleQuery = `title=${encodeURIComponent(title.trim())}`;
    const authorQuery = author?.trim() ? `&author=${encodeURIComponent(author.trim())}` : "";
    const response = await fetch(`https://openlibrary.org/search.json?${titleQuery}${authorQuery}`);
    if (!response.ok) throw new Error("OpenLibrary request failed.");
    return await response.json();
}

export async function fetchBookMetadata(title: string, author?: string): Promise<BookMetadata> {
    if (!title.trim()) throw new Error("Title is required.");

    const googleData = await fetchGoogleBooks(title, author);
    const googleBookInfo = googleData.items?.[0]?.volumeInfo;

    const description = cleanDescriptionText(googleBookInfo?.description || "");
    const genres = extractMainGenres(googleBookInfo?.categories || []);
    const normalizedAuthor = googleBookInfo?.authors?.[0]?.trim() || "";
    const publishedYear = getPublishedYear(googleBookInfo?.publishedDate);

    if (!description || genres.length === 0) {
        const openLibraryData = await fetchOpenLibrary(title, author);
        const openLibraryDoc = openLibraryData.docs?.[0];

        return {
            author: normalizedAuthor || openLibraryDoc?.author_name?.[0]?.trim() || "",
            description: description || cleanDescriptionText(openLibraryDoc?.first_sentence || ""),
            genres: genres.length > 0 ? genres : extractMainGenres(openLibraryDoc?.subject || []),
            publishedYear: publishedYear || String(openLibraryDoc?.first_publish_year || ""),
        };
    }

    return { author: normalizedAuthor, description, genres, publishedYear };
}

export async function fetchBookMetadataExtended(
    title: string,
    author?: string
): Promise<BookMetadataExtended> {
    const base = await fetchBookMetadata(title, author);
    const safeDescriptionResult = sanitizeFetchedDescription(base.description);

    // Fetch extra info from Google if needed (usually already there in the first call, but we keep the logic split for clarity)
    const googleData = await fetchGoogleBooks(title, author);
    const info = googleData.items?.[0]?.volumeInfo;

    const publisher = info?.publisher?.trim() || "";
    const pageCount = typeof info?.pageCount === "number" ? info.pageCount : undefined;

    return {
        ...base,
        description: safeDescriptionResult.description,
        descriptionRejectedReason: safeDescriptionResult.rejectedReason,
        publisher: publisher || undefined,
        pageCount,
    };
}
