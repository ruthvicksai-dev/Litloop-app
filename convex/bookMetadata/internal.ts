import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { assertAdmin } from "../lib/authHelpers";
import { normalizeIsbn } from "./isbn";

/**
 * Internal query to authenticate admin and perform database ISBN duplicate check.
 * Strictly uses the normalized ISBN for querying the `by_isbn` index.
 */
export const assertAdminAndCheckIsbn = internalQuery({
    args: {
        accessToken: v.string(),
        isbn: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await assertAdmin(ctx, args.accessToken);
        const normalizedIsbn = normalizeIsbn(args.isbn);

        let existingBook = null;
        if (normalizedIsbn) {
            existingBook = await ctx.db
                .query("books")
                .withIndex("by_isbn", (q) => q.eq("isbn", normalizedIsbn))
                .first();
        }

        return {
            adminId: admin._id,
            normalizedIsbn,
            existingBook: existingBook
                ? {
                    _id: existingBook._id,
                    title: existingBook.title,
                    author: existingBook.author,
                }
                : null,
        };
    },
});

/**
 * Internal query to check if a book with a given title (or title + author) already exists in the database.
 */
export const checkBookByTitle = internalQuery({
    args: {
        title: v.string(),
        author: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const titleTrim = args.title.trim();
        if (!titleTrim) return null;

        // First check by exact title & author if author is present
        if (args.author && args.author.trim()) {
            const authorTrim = args.author.trim();
            const matchByTitleAuthor = await ctx.db
                .query("books")
                .withIndex("by_title_author", (q) =>
                    q.eq("title", titleTrim).eq("author", authorTrim)
                )
                .first();
            if (matchByTitleAuthor) {
                return {
                    _id: matchByTitleAuthor._id,
                    title: matchByTitleAuthor.title,
                    author: matchByTitleAuthor.author,
                };
            }
        }

        // Then check by title alone using by_title index
        const matchByTitle = await ctx.db
            .query("books")
            .withIndex("by_title", (q) => q.eq("title", titleTrim))
            .first();

        if (matchByTitle) {
            return {
                _id: matchByTitle._id,
                title: matchByTitle.title,
                author: matchByTitle.author,
            };
        }

        return null;
    },
});
