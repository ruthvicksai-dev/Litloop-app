import { MAIN_GENRES } from "../books/helpers";

const MAX_MAIN_GENRES = 3;

const DISALLOWED_WORDS = [
    "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "pussy", "motherfucker",
];

const DISALLOWED_WORDS_REGEX = new RegExp(
    `\\b(${DISALLOWED_WORDS.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
    "i"
);

const ENGLISH_STOPWORDS_REGEX = /\b(the|and|to|of|in|is|it|that|with|for|as|on|was|are|be|at|by|from)\b/gi;
const LETTER_REGEX = /\p{Letter}/u;
const LATIN_LETTER_REGEX = /\p{Script=Latin}/u;

const GENRE_LOOKUP = new Map(
    MAIN_GENRES.map((genre) => [genre.toLowerCase(), genre])
);

const GENRE_ALIASES: Array<{ match: string; genre: string }> = [
    { match: "science fiction", genre: "Sci-Fi" },
    { match: "sci fi", genre: "Sci-Fi" },
    { match: "scifi", genre: "Sci-Fi" },
    { match: "crime fiction", genre: "Crime" },
    { match: "contemporary romance", genre: "Romance" },
    { match: "contemporary fiction", genre: "Fiction" },
    { match: "romantic comedy", genre: "Romcom" },
    { match: "rom com", genre: "Rom com" },
    { match: "self help", genre: "Self Help" },
    { match: "self-help", genre: "Self Help" },
    { match: "love story", genre: "Romance" },
    { match: "action", genre: "Action" },
    { match: "adventure", genre: "Adventure" },
    { match: "thriller", genre: "Thriller" },
    { match: "suspense", genre: "Thriller" },
    { match: "mystery", genre: "Mystery" },
    { match: "detective", genre: "Mystery" },
    { match: "crime", genre: "Crime" },
    { match: "romance", genre: "Romance" },
    { match: "fiction", genre: "Fiction" },
    { match: "fantasy", genre: "Fantasy" },
    { match: "horror", genre: "Horror" },
    { match: "biography", genre: "Biography" },
    { match: "autobiography", genre: "Biography" },
    { match: "history", genre: "History" },
    { match: "historical", genre: "History" },
    { match: "business", genre: "Business" },
    { match: "economics", genre: "Business" },
    { match: "psychology", genre: "Psychology" },
];

export function cleanDescriptionText(text?: string): string {
    if (!text) return "";
    return text
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function hasNonLatinLetters(value: string) {
    for (const char of value) {
        if (LETTER_REGEX.test(char) && !LATIN_LETTER_REGEX.test(char)) return true;
    }
    return false;
}

function looksLikeEnglish(value: string) {
    const text = cleanDescriptionText(value);
    if (text.length < 40) return true;
    const matches = text.match(ENGLISH_STOPWORDS_REGEX);
    return text.length >= 80 ? (matches?.length ?? 0) >= 1 : true;
}

export type DescriptionValidationFailureCode = "non_latin_letters" | "not_english" | "disallowed_words";

export function validateEnglishSafeDescription(value: string):
    | { ok: true }
    | { ok: false; code: DescriptionValidationFailureCode; reason: string } {
    const text = cleanDescriptionText(value);
    if (!text) return { ok: true };

    if (hasNonLatinLetters(text)) {
        return { ok: false, code: "non_latin_letters", reason: "Description must be in English (Latin characters only)." };
    }
    if (!looksLikeEnglish(text)) {
        return { ok: false, code: "not_english", reason: "Description must be in English." };
    }
    if (DISALLOWED_WORDS_REGEX.test(text)) {
        return { ok: false, code: "disallowed_words", reason: "Description contains disallowed words." };
    }
    return { ok: true };
}

export function sanitizeFetchedDescription(value: string): { description: string; rejectedReason?: string } {
    const text = cleanDescriptionText(value);
    const validation = validateEnglishSafeDescription(text);
    return validation.ok ? { description: text } : { description: "", rejectedReason: validation.reason };
}

export function extractMainGenres(categories?: string[]): string[] {
    if (!categories || categories.length === 0) return [];

    const foundGenres: string[] = [];

    for (const category of categories) {
        if (!category) continue;

        const normalizedCategory = category.trim().toLowerCase();
        if (!normalizedCategory) continue;

        const exactMatch = GENRE_LOOKUP.get(normalizedCategory);
        if (exactMatch && !foundGenres.includes(exactMatch)) {
            foundGenres.push(exactMatch);
        } else {
            for (const alias of GENRE_ALIASES) {
                if (
                    normalizedCategory.includes(alias.match) &&
                    !foundGenres.includes(alias.genre)
                ) {
                    foundGenres.push(alias.genre);
                    break;
                }
            }
        }

        if (foundGenres.length >= MAX_MAIN_GENRES) break;
    }

    return foundGenres.slice(0, MAX_MAIN_GENRES);
}

export function getPublishedYear(publishedDate?: string): string {
    if (!publishedDate) return "";
    const match = publishedDate.match(/\b\d{4}\b/);
    return match ? match[0] : "";
}
