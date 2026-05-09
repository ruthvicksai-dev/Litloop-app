/**
 * Shared book helper — used by rentals.ts and payments.ts.
 * Resolves cover image storage URLs for a book record.
 */
export function calculateRankingScore(book: {
    rating?: number;
    bookRentals?: number;
    bookViews?: number;
}) {
    return (book.rating ?? 0) * 0.5 +
        (book.bookRentals ?? 0) * 0.3 +
        (book.bookViews ?? 0) * 0.2;
}

async function resolveCoverUrls(
    ctx: { storage: any },
    book: {
        coverImage?: any;
        coverImages?: any[];
    }
): Promise<{ coverUrl: string | null; coverUrls: string[] }> {
    let coverUrl: string | null = null;
    const coverUrls: string[] = [];

    if (book.coverImages && book.coverImages.length > 0) {
        for (const imageId of book.coverImages) {
            const url = await ctx.storage.getUrl(imageId);
            if (url) coverUrls.push(url);
        }
        if (coverUrls.length > 0) coverUrl = coverUrls[0];
    } else if (book.coverImage) {
        coverUrl = await ctx.storage.getUrl(book.coverImage);
        if (coverUrl) coverUrls.push(coverUrl);
    }

    return { coverUrl, coverUrls };
}

export async function mapBookForClient(
    ctx: { storage: any },
    book: any
): Promise<any> {
    const { coverUrl, coverUrls } = await resolveCoverUrls(ctx, book);
    return {
        ...book,
        genre: book.genre ?? book.genres?.[0] ?? "General",
        genres: book.genres ?? [],
        rating: typeof book.rating === "number" ? book.rating : 0,
        ratingCount: typeof book.ratingCount === "number" ? book.ratingCount : 0,
        bookViews: typeof book.bookViews === "number" ? book.bookViews : 0,
        bookRentals: typeof book.bookRentals === "number" ? book.bookRentals : 0,
        rankingScore: typeof book.rankingScore === "number"
            ? book.rankingScore
            : calculateRankingScore(book),
        isTop10: Boolean(book.isTop10),
        isFamous: Boolean(book.isFamous),
        isTrending: Boolean(book.isTrending),
        coverUrl,
        coverUrls,
    };
}

export async function getBookWithCoverUrls(ctx: { db: any; storage: any }, bookId: any) {
    const book = await ctx.db.get(bookId);
    if (!book) return null;

    const { coverUrl, coverUrls } = await resolveCoverUrls(ctx, book);
    return { ...book, coverUrl, coverUrls };
}
