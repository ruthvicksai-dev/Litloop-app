export const SERIES_DETAIL_BOOK_LIMIT = 50;

export async function mapSeriesForClient(ctx: any, series: any) {
    const coverUrl = await ctx.storage.getUrl(series.coverImage);
    return {
        ...series,
        coverUrl,
    };
}
