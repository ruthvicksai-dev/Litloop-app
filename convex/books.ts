import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const books = await ctx.db.query("books").collect();
        // Attach cover image URLs (both old coverImage and new coverImages array)
        const booksWithUrls = await Promise.all(
            books.map(async (book) => {
                let coverUrl: string | null = null;
                const coverUrls: string[] = [];

                if (book.coverImages && book.coverImages.length > 0) {
                    for (const curr of book.coverImages) {
                        const url = await ctx.storage.getUrl(curr);
                        if (url) coverUrls.push(url);
                    }
                    if (coverUrls.length > 0) coverUrl = coverUrls[0];
                } else if (book.coverImage) {
                    coverUrl = await ctx.storage.getUrl(book.coverImage);
                    if (coverUrl) coverUrls.push(coverUrl);
                }

                return { ...book, coverUrl, coverUrls };
            })
        );
        return booksWithUrls;
    },
});

export const get = query({
    args: { bookId: v.id("books") },
    handler: async (ctx, args) => {
        const book = await ctx.db.get(args.bookId);
        if (!book) throw new Error("Book not found.");

        let coverUrl: string | null = null;
        const coverUrls: string[] = [];

        if (book.coverImages && book.coverImages.length > 0) {
            for (const curr of book.coverImages) {
                const url = await ctx.storage.getUrl(curr);
                if (url) coverUrls.push(url);
            }
            if (coverUrls.length > 0) coverUrl = coverUrls[0];
        } else if (book.coverImage) {
            coverUrl = await ctx.storage.getUrl(book.coverImage);
            if (coverUrl) coverUrls.push(coverUrl);
        }

        return { ...book, coverUrl, coverUrls };
    },
});

export const add = mutation({
    args: {
        title: v.string(),
        author: v.string(),
        description: v.string(),
        rentPerDay: v.number(),
        coverImage: v.optional(v.id("_storage")),
        coverImages: v.optional(v.array(v.id("_storage"))),
        totalCopies: v.number(),
    },
    handler: async (ctx, args) => {
        if (!args.title.trim()) throw new Error("Title is required.");
        if (!args.author.trim()) throw new Error("Author is required.");
        if (args.rentPerDay <= 0) throw new Error("Rent per day must be positive.");
        if (args.totalCopies <= 0)
            throw new Error("Total copies must be positive.");

        const bookId = await ctx.db.insert("books", {
            title: args.title.trim(),
            author: args.author.trim(),
            description: args.description.trim(),
            rentPerDay: args.rentPerDay,
            coverImage: args.coverImage,
            coverImages: args.coverImages,
            totalCopies: args.totalCopies,
            availableCopies: args.totalCopies,
            createdAt: Date.now(),
        });

        return bookId;
    },
});

export const update = mutation({
    args: {
        bookId: v.id("books"),
        title: v.optional(v.string()),
        author: v.optional(v.string()),
        description: v.optional(v.string()),
        rentPerDay: v.optional(v.number()),
        coverImage: v.optional(v.id("_storage")),
        coverImages: v.optional(v.array(v.id("_storage"))),
        totalCopies: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const book = await ctx.db.get(args.bookId);
        if (!book) throw new Error("Book not found.");

        const updates: Record<string, unknown> = {};
        if (args.title !== undefined) updates.title = args.title.trim();
        if (args.author !== undefined) updates.author = args.author.trim();
        if (args.description !== undefined)
            updates.description = args.description.trim();
        if (args.rentPerDay !== undefined) updates.rentPerDay = args.rentPerDay;
        if (args.coverImage !== undefined) updates.coverImage = args.coverImage;
        if (args.coverImages !== undefined) updates.coverImages = args.coverImages;
        if (args.totalCopies !== undefined) {
            const diff = args.totalCopies - book.totalCopies;
            updates.totalCopies = args.totalCopies;
            updates.availableCopies = Math.max(0, book.availableCopies + diff);
        }

        await ctx.db.patch(args.bookId, updates);
    },
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const remove = mutation({
    args: { bookId: v.id("books") },
    handler: async (ctx, args) => {
        const book = await ctx.db.get(args.bookId);
        if (!book) throw new Error("Book not found.");

        // Check for active rentals
        const activeRentals = await ctx.db
            .query("rentals")
            .filter((q) =>
                q.and(
                    q.eq(q.field("bookId"), args.bookId),
                    q.neq(q.field("status"), "returned")
                )
            )
            .first();
        if (activeRentals) {
            throw new Error("Cannot remove a book with active rentals.");
        }

        // Delete the legacy cover image from storage if it exists
        if (book.coverImage) {
            await ctx.storage.delete(book.coverImage);
        }

        // Delete all images in the coverImages gallery from storage if they exist
        if (book.coverImages) {
            for (const imageId of book.coverImages) {
                await ctx.storage.delete(imageId);
            }
        }

        await ctx.db.delete(args.bookId);
    },
});

