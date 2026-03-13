import { MAIN_GENRES } from "@/constants/mainGenres";

const MAX_MAIN_GENRES = 3;

type GoogleBooksItem = {
    volumeInfo?: {
        authors?: string[];
        categories?: string[];
        description?: string;
        publishedDate?: string;
        imageLinks?: {
            extraLarge?: string;
            large?: string;
            medium?: string;
            small?: string;
            thumbnail?: string;
            smallThumbnail?: string;
        };
        industryIdentifiers?: Array<{
            type: string;
            identifier: string;
        }>;
    };
};

type GoogleBooksResponse = {
    items?: GoogleBooksItem[];
};

type OpenLibraryDoc = {
    author_name?: string[];
    first_sentence?: string | { value?: string } | Array<string | { value?: string }>;
    isbn?: string[];
    subject?: string[];
};

type OpenLibraryResponse = {
    docs?: OpenLibraryDoc[];
};

export type BookMetadata = {
    author: string;
    description: string;
    genres: string[];
    publishedYear: string;
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

function toTitleCase(value: string) {
    return value
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

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

function getGoogleBookInfo(data: GoogleBooksResponse) {
    return data.items?.[0]?.volumeInfo;
}

function getOpenLibraryFirstSentence(
    value?: OpenLibraryDoc["first_sentence"]
) {
    if (!value) {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value)) {
        const first = value[0];
        if (!first) {
            return "";
        }
        return typeof first === "string" ? first : first.value || "";
    }

    return value.value || "";
}

function getPublishedYear(value?: string) {
    if (!value) {
        return "";
    }

    const match = value.match(/\b\d{4}\b/);
    return match?.[0] || value;
}

async function fetchGoogleBooks(title: string, author?: string) {
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

    return (await response.json()) as GoogleBooksResponse;
}

async function fetchOpenLibrary(title: string) {
    const response = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title.trim())}`
    );

    if (!response.ok) {
        throw new Error("OpenLibrary request failed.");
    }

    return (await response.json()) as OpenLibraryResponse;
}

export async function fetchBookMetadata(title: string, author?: string): Promise<BookMetadata> {
    if (!title.trim()) {
        throw new Error("Title is required to fetch book info.");
    }

    const googleData = await fetchGoogleBooks(title, author);
    const googleBookInfo = getGoogleBookInfo(googleData);

    const googleDescription = cleanDescriptionText(googleBookInfo?.description || "");
    const googleGenres = extractMainGenres(googleBookInfo?.categories || []);
    const googleAuthor = googleBookInfo?.authors?.[0]?.trim() || "";
    const publishedYear = getPublishedYear(googleBookInfo?.publishedDate);

    let description = googleDescription;
    let genres = googleGenres;
    let normalizedAuthor = googleAuthor;

    if (!description || genres.length === 0) {
        const openLibraryData = await fetchOpenLibrary(title);
        const openLibraryDoc = openLibraryData.docs?.[0];

        if (!description) {
            description = cleanDescriptionText(
                getOpenLibraryFirstSentence(openLibraryDoc?.first_sentence)
            );
        }

        if (genres.length === 0) {
            genres = extractMainGenres(openLibraryDoc?.subject || []);
        }

        if (!normalizedAuthor) {
            normalizedAuthor = openLibraryDoc?.author_name?.[0]?.trim() || "";
        }
    }

    return {
        author: normalizedAuthor,
        description,
        genres,
        publishedYear,
    };
}
