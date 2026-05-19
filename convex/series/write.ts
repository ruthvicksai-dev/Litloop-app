import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { assertAdmin } from "../lib/authHelpers";

export const add = mutation({
    args: {
        name: v.string(),
        coverImage: v.id("_storage"),
        description: v.optional(v.string()),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);
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
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);
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
    args: { seriesId: v.id("book_series"), accessToken: v.string() },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);
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
