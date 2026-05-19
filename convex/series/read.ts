import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "../_generated/server";
import { mapBookForClient } from "../lib/bookHelpers";
import { mapSeriesForClient, SERIES_DETAIL_BOOK_LIMIT } from "./helpers";

export const list = query({
    args: { paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        const results = await ctx.db.query("book_series").order("desc").paginate(args.paginationOpts);
        const mapped = await Promise.all(results.page.map((s) => mapSeriesForClient(ctx, s)));
        return { ...results, page: mapped };
    },
});

export const getWithBooks = query({
    args: {
        seriesId: v.id("book_series"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const series = await ctx.db.get(args.seriesId);
        if (!series) return null;

        const take = Math.min(args.limit ?? SERIES_DETAIL_BOOK_LIMIT, SERIES_DETAIL_BOOK_LIMIT);
        const books = await ctx.db
            .query("books")
            .withIndex("by_seriesId", (q) => q.eq("seriesId", args.seriesId))
            .take(take);

        const mappedSeries = await mapSeriesForClient(ctx, series);

        const mappedBooks = await Promise.all(books.map(b => mapBookForClient(ctx as any, b)));

        return {
            ...mappedSeries,
            books: mappedBooks,
        };
    },
});
