/**
 * Shared book helper — used by rentals.ts and payments.ts.
 * Resolves cover image storage URLs for a book record.
 */
export async function getBookWithCoverUrls(ctx: { db: any; storage: any }, bookId: any) {
    const book = await ctx.db.get(bookId);
    if (!book) return null;

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

    return { ...book, coverUrl, coverUrls };
}
