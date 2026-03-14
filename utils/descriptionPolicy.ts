const DISALLOWED_WORDS = [
    "fuck",
    "shit",
    "bitch",
    "asshole",
    "bastard",
    "cunt",
    "dick",
    "pussy",
    "motherfucker",
];

const DISALLOWED_WORDS_REGEX = new RegExp(
    `\\b(${DISALLOWED_WORDS.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
    "i"
);

const ENGLISH_STOPWORDS_REGEX =
    /\b(the|and|to|of|in|is|it|that|with|for|as|on|was|are|be|at|by|from)\b/gi;

const LETTER_REGEX = /\p{Letter}/u;
const LATIN_LETTER_REGEX = /\p{Script=Latin}/u;

function normalizeText(value: string) {
    return value
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function hasNonLatinLetters(value: string) {
    for (const char of value) {
        if (LETTER_REGEX.test(char) && !LATIN_LETTER_REGEX.test(char)) {
            return true;
        }
    }
    return false;
}

function looksLikeEnglish(value: string) {
    const text = normalizeText(value);
    if (text.length < 40) return true;

    const matches = text.match(ENGLISH_STOPWORDS_REGEX);
    const count = matches?.length ?? 0;

    if (text.length >= 80) return count >= 1;
    return true;
}

export type DescriptionValidationFailureCode =
    | "non_latin_letters"
    | "not_english"
    | "disallowed_words";

export function validateEnglishSafeDescription(
    value: string
):
    | { ok: true }
    | { ok: false; code: DescriptionValidationFailureCode; reason: string } {
    const text = normalizeText(value);
    if (!text) return { ok: true };

    if (hasNonLatinLetters(text)) {
        return {
            ok: false,
            code: "non_latin_letters",
            reason: "Description must be in English (Latin characters only).",
        };
    }

    if (!looksLikeEnglish(text)) {
        return { ok: false, code: "not_english", reason: "Description must be in English." };
    }

    if (DISALLOWED_WORDS_REGEX.test(text)) {
        return {
            ok: false,
            code: "disallowed_words",
            reason: "Description contains disallowed words.",
        };
    }

    return { ok: true };
}

export function sanitizeFetchedDescription(value: string): {
    description: string;
    rejectedReason?: string;
} {
    const text = normalizeText(value);
    const validation = validateEnglishSafeDescription(text);
    return validation.ok ? { description: text } : { description: "", rejectedReason: validation.reason };
}
