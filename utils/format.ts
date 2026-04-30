/**
 * Shared formatting utilities used across the app.
 */

/**
 * Formats a number as Indian Rupee currency string (e.g. ₹1,200).
 */
export const formatCurrency = (amount?: number | null): string =>
    `\u20B9${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount ?? 0)}`;

type BookWithOptionalCover = {
    title?: string;
    author?: string;
    coverUrl?: string;
    coverUrls?: string[];
};

type CoverCarrier = {
    coverUrl?: string | null;
    coverUrls?: string[];
    book?: BookWithOptionalCover | null;
};

/**
 * Resolves a book cover URI from various possible shapes of rental/book objects.
 * Checks `book.coverUrl`, `book.coverUrls[0]`, then top-level `coverUrl`/`coverUrls[0]`.
 */
export const getBookCoverUri = (value: unknown): string | null => {
    if (!value || typeof value !== "object") {
        return null;
    }

    const candidate = value as CoverCarrier;
    return (
        candidate.book?.coverUrl ||
        candidate.book?.coverUrls?.[0] ||
        candidate.coverUrl ||
        candidate.coverUrls?.[0] ||
        null
    );
};
