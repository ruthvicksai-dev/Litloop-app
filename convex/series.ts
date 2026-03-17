import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export async function mapSeriesForClient(ctx: any, series: any) {
    const coverUrl = await ctx.storage.getUrl(series.coverImage);
    return {
        ...series,
        coverUrl,
    };
}

export const list = query({
    args: {},
    handler: async (ctx) => {
        const series = await ctx.db.query("book_series").order("desc").collect();
        return Promise.all(series.map((s) => mapSeriesForClient(ctx, s)));
    },
});

export const getWithBooks = query({
    args: { seriesId: v.id("book_series") },
    handler: async (ctx, args) => {
        const series = await ctx.db.get(args.seriesId);
        if (!series) return null;

        const books = await ctx.db
            .query("books")
            .withIndex("by_seriesId", (q) => q.eq("seriesId", args.seriesId))
            .collect();

        const mappedSeries = await mapSeriesForClient(ctx, series);

        // Circular dependency check if needed, but here we just map books
        const { mapBookForClient } = await import("./books");
        const mappedBooks = await Promise.all(books.map(b => mapBookForClient(ctx, b)));

        return {
            ...mappedSeries,
            books: mappedBooks,
        };
    },
});

export const add = mutation({
    args: {
        name: v.string(),
        coverImage: v.id("_storage"),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const seriesId = await ctx.db.insert("book_series", {
            name: args.name.trim(),
            coverImage: args.coverImage,
            description: args.description?.trim(),
            createdAt: Date.now(),
        });
        return seriesId;
    },
});

export const update = mutation({
    args: {
        seriesId: v.id("book_series"),
        name: v.optional(v.string()),
        coverImage: v.optional(v.id("_storage")),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const current = await ctx.db.get(args.seriesId);
        if (!current) throw new Error("Series not found");

        const updates: any = {};
        if (args.name !== undefined) updates.name = args.name.trim();
        if (args.description !== undefined) updates.description = args.description?.trim();

        if (args.coverImage !== undefined && current.coverImage !== args.coverImage) {
            await ctx.storage.delete(current.coverImage);
            updates.coverImage = args.coverImage;
        }

        await ctx.db.patch(args.seriesId, updates);
    },
});

export const remove = mutation({
    args: { seriesId: v.id("book_series") },
    handler: async (ctx, args) => {
        const series = await ctx.db.get(args.seriesId);
        if (!series) throw new Error("Series not found");

        // Check for books assigned to this series
        const books = await ctx.db
            .query("books")
            .withIndex("by_seriesId", (q) => q.eq("seriesId", args.seriesId))
            .first();

        if (books) {
            throw new Error("Cannot delete series that still has books assigned to it.");
        }

        await ctx.storage.delete(series.coverImage);
        await ctx.db.delete(args.seriesId);
    },
});
