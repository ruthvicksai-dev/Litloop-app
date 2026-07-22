export const MAIN_GENRES = [
    "Action",
    "Adventure",
    "Thriller",
    "Mystery",
    "Fantasy",
    "Sci-Fi",
    "Romance",
    "Horror",
    "Biography",
    "History",
    "Self Help",
    "Rom com",
    "Education",
    "Business",
    "Psychology",
];

export const BOOK_RATE_LIMITS = {
    uploadUrl: {
        limit: 30,
        windowMs: 15 * 60 * 1000,
        message: "Too many upload requests. Please try again later.",
    },
    // S-02 FIX: Rate limit for incrementBookViews — prevents view-count inflation
    incrementViews: {
        limit: 30,
        windowMs: 60 * 60 * 1000,
        message: "Too many view requests. Please try again later.",
    },
} as const;

export const GENRE_KEYWORDS: Record<string, string[]> = {
    Romance: ["love", "relationship", "romance", "affair", "couple", "heart", "emotion"],
    Thriller: ["murder", "crime", "killer", "investigation", "suspense", "police"],
    Fantasy: ["magic", "dragon", "kingdom", "wizard", "myth", "power"],
    "Sci-Fi": ["space", "future", "robot", "alien", "technology"],
    Horror: ["ghost", "haunted", "fear", "dark"],
    Mystery: ["mystery", "detective", "case"],
    Biography: ["life", "story", "journey"],
    Business: ["startup", "money", "finance"],
    Psychology: ["mind", "behavior"],
    "Self Help": ["habit", "growth", "improve"],
};

export function detectGenre(title: string, description: string): string | undefined {
    const text = (title + " " + description).toLowerCase();
    const words = text.split(/\W+/).map(w => w.replace(/(ing|ed|s)$/, "")); // 🔥 normalize

    let bestMatch: string | undefined;
    let maxScore = 0;

    for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
        let score = 0;

        for (const keyword of keywords) {
            const key = keyword.toLowerCase();
            if (words.includes(key)) score += 2;
            if (text.includes(key)) score += 1;
        }
        if (genre === "Romance") {
            score *= 0.8;
        }
        if (score > maxScore || (score === maxScore && genre !== "Romance")) {
            maxScore = score;
            bestMatch = genre;
        }
    }
    return maxScore >= 2 ? bestMatch : undefined;
}

export function normalizeGenres(genres: string[] | undefined) {
    return Array.from(
        new Set(
            (genres ?? [])
                .map((genre) => genre.trim())
                .map((genre) => MAIN_GENRES.find(g => g.toLowerCase() === genre.toLowerCase()) ?? genre)
                .filter((genre) => MAIN_GENRES.includes(genre))
                .filter(Boolean)
        )
    ).slice(0, 3);
}

export function normalizeBookValue(value: string): string {
    return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeSingleGenre(genre: string | undefined): string | undefined {
    if (!genre) return undefined;
    const normalized = genre.trim();
    return MAIN_GENRES.find(g => g.toLowerCase() === normalized.toLowerCase());
}

export function buildSearchText(input: {
    title: string;
    author: string;
    isbn?: string;
    genre?: string;
    genres?: string[];
}) {
    const tokens = [
        input.title,
        input.author,
        input.isbn ?? "",
        input.genre ?? "",
        ...(input.genres ?? []),
    ]
        .map(normalizeBookValue)
        .filter(Boolean);

    return Array.from(new Set(tokens)).join(" ");
}

export function normalizeRating(rating: number | undefined) {
    if (rating === undefined) return 0;
    if (!Number.isFinite(rating)) return 0;
    return Math.max(0, Math.min(5, rating));
}

export function normalizeOptionalPositiveInt(value: number | undefined, fieldLabel: string) {
    if (value === undefined) return undefined;
    if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) {
        throw new Error(`${fieldLabel} must be a positive whole number.`);
    }
    return value;
}

export function normalizeNonNegativeInt(value: number | undefined, fallback = 0) {
    if (value === undefined) return fallback;
    if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
        throw new Error("Value must be a non-negative whole number.");
    }
    return value;
}

export function normalizePublishedYear(value: number | undefined) {
    if (value === undefined) return undefined;
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
        throw new Error("Published year must be a valid year.");
    }
    const currentYear = new Date().getFullYear();
    if (value < 1400 || value > currentYear + 1) {
        throw new Error("Published year must be a valid year.");
    }
    return value;
}

export function normalizeTop10Position(
    isTop10: boolean | undefined,
    top10Position: number | undefined
) {
    if (!isTop10) return undefined;
    if (top10Position === undefined) {
        throw new Error("Top 10 position is required when Top 10 is selected.");
    }
    if (!Number.isInteger(top10Position) || top10Position < 1 || top10Position > 10) {
        throw new Error("Top 10 position must be between 1 and 10.");
    }
    return top10Position;
}

export function normalizeSeries(series: string | undefined) {
    if (series === undefined) return undefined;
    const normalized = series.trim();
    return normalized || undefined;
}
