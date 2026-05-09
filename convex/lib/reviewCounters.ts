export const RATING_COUNT_FIELDS = [
    "rating1Count",
    "rating2Count",
    "rating3Count",
    "rating4Count",
    "rating5Count",
] as const;

export type RatingCountField = (typeof RATING_COUNT_FIELDS)[number];

export function getRatingStar(rating: number) {
    return Math.min(5, Math.max(1, Math.round(rating)));
}

export function getRatingCountField(rating: number): RatingCountField {
    return `rating${getRatingStar(rating)}Count` as RatingCountField;
}

export function getRatingDistributionFromBook(book: any): Record<number, number> {
    return {
        5: book?.rating5Count ?? 0,
        4: book?.rating4Count ?? 0,
        3: book?.rating3Count ?? 0,
        2: book?.rating2Count ?? 0,
        1: book?.rating1Count ?? 0,
    };
}

export function incrementRatingCountPatch(book: any, rating: number, delta: number) {
    const field = getRatingCountField(rating);
    return {
        [field]: Math.max(0, (book?.[field] ?? 0) + delta),
    };
}

export function moveRatingCountPatch(book: any, oldRating: number, newRating: number) {
    const oldField = getRatingCountField(oldRating);
    const newField = getRatingCountField(newRating);

    if (oldField === newField) {
        return {};
    }

    return {
        [oldField]: Math.max(0, (book?.[oldField] ?? 0) - 1),
        [newField]: (book?.[newField] ?? 0) + 1,
    };
}

