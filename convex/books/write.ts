import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { mutation } from "../_generated/server";
import { insertAuditLog } from "../lib/auditLog";
import { assertAdmin } from "../lib/authHelpers";
import { calculateRankingScore } from "../lib/bookHelpers";
import { assertRateLimit, buildRateLimitKey } from "../lib/rateLimit";
import {
    BOOK_RATE_LIMITS,
    buildSearchText,
    detectGenre,
    normalizeGenres,
    normalizeNonNegativeInt,
    normalizeOptionalPositiveInt,
    normalizePublishedYear,
    normalizeRating,
    normalizeSeries,
    normalizeSingleGenre,
    normalizeTop10Position,
} from "./helpers";

export const incrementBookViews = mutation({
    args: { bookId: v.id("books") },
    handler: async (ctx, args) => {
        await ctx.scheduler.runAfter(0, internal.books.internal.internalIncrementBookViews, {
            bookId: args.bookId,
        });
        return true;
    },
});

export const add = mutation({
    args: {
        title: v.string(),
        author: v.string(),
        description: v.string(),
        genre: v.optional(v.string()),
        genres: v.array(v.string()),
        rating: v.optional(v.number()),
        ratingCount: v.optional(v.number()),
        bookViews: v.optional(v.number()),
        bookRentals: v.optional(v.number()),
        pageCount: v.optional(v.number()),
        publishedYear: v.optional(v.number()),
        publisher: v.optional(v.string()),
        isbn: v.optional(v.string()),
        isTop10: v.optional(v.boolean()),
        top10Position: v.optional(v.number()),
        isFamous: v.optional(v.boolean()),
        isTrending: v.optional(v.boolean()),
        series: v.optional(v.string()),
        seriesId: v.optional(v.id("book_series")),
        rentPerDay: v.number(),
        coverImage: v.optional(v.id("_storage")),
        coverImages: v.optional(v.array(v.id("_storage"))),
        totalCopies: v.number(),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await assertAdmin(ctx, args.accessToken);
        const title = args.title.trim();
        const author = args.author.trim();
        const description = args.description.trim();
        const isbn = args.isbn?.replace(/[-\s]/g, "").trim().toUpperCase() || undefined;

        if (!title) throw new Error("Title is required.");
        if (!author) throw new Error("Author is required.");
        if (args.rentPerDay <= 0) throw new Error("Rent per day must be positive.");
        if (args.totalCopies <= 0)
            throw new Error("Total copies must be positive.");

        const duplicateBook = await ctx.db
            .query("books")
            .withIndex("by_title_author", (q) =>
                q.eq("title", title).eq("author", author)
            )
            .first();
        if (duplicateBook) {
            throw new Error("This book already exists.");
        }

        const normalizedGenres = normalizeGenres(args.genres);
        const detectedGenre = detectGenre(title, description);
        const primaryGenre =
            normalizeSingleGenre(args.genre) ??
            detectedGenre ??
            normalizedGenres[0] ??
            "Education";
        const pageCount = normalizeOptionalPositiveInt(args.pageCount, "Page count");
        const publishedYear = normalizePublishedYear(args.publishedYear);
        const isTop10 = Boolean(args.isTop10);
        const top10Position = normalizeTop10Position(isTop10, args.top10Position);
        const rating = normalizeRating(args.rating);
        const bookViews = normalizeNonNegativeInt(args.bookViews, 0);
        const bookRentals = normalizeNonNegativeInt(args.bookRentals, 0);
        const rankingScore = calculateRankingScore({
            rating,
            bookRentals,
            bookViews,
        });

        const bookId = await ctx.db.insert("books", {
            title,
            author,
            description,
            genre: primaryGenre,
            genres: normalizedGenres,
            rating,
            ratingCount: normalizeNonNegativeInt(args.ratingCount, 0),
            bookViews,
            bookRentals,
            rankingScore,
            pageCount,
            publishedYear,
            publisher: args.publisher?.trim() || undefined,
            isbn,
            isTop10,
            top10Position,
            isFamous: Boolean(args.isFamous),
            isTrending: Boolean(args.isTrending),
            series: normalizeSeries(args.series),
            seriesId: args.seriesId,
            searchText: buildSearchText({
                title,
                author,
                isbn,
                genre: primaryGenre,
                genres: normalizedGenres,
            }),
            rentPerDay: args.rentPerDay,
            coverImage: args.coverImage,
            coverImages: args.coverImages,
            totalCopies: args.totalCopies,
            availableCopies: args.totalCopies,
            createdAt: Date.now(),
        });

        await insertAuditLog(ctx, "book_added", admin._id, bookId, "book", { title });

        return bookId;
    },
});

export const update = mutation({
    args: {
        bookId: v.id("books"),
        title: v.optional(v.string()),
        author: v.optional(v.string()),
        description: v.optional(v.string()),
        genre: v.optional(v.string()),
        genres: v.optional(v.array(v.string())),
        rating: v.optional(v.number()),
        ratingCount: v.optional(v.number()),
        bookViews: v.optional(v.number()),
        bookRentals: v.optional(v.number()),
        pageCount: v.optional(v.number()),
        publishedYear: v.optional(v.number()),
        publisher: v.optional(v.string()),
        isbn: v.optional(v.string()),
        isTop10: v.optional(v.boolean()),
        top10Position: v.optional(v.number()),
        isFamous: v.optional(v.boolean()),
        isTrending: v.optional(v.boolean()),
        series: v.optional(v.string()),
        seriesId: v.optional(v.id("book_series")),
        rentPerDay: v.optional(v.number()),
        coverImage: v.optional(v.id("_storage")),
        coverImages: v.optional(v.array(v.id("_storage"))),
        totalCopies: v.optional(v.number()),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await assertAdmin(ctx, args.accessToken);
        const book = await ctx.db.get(args.bookId);
        if (!book) throw new Error("Book not found.");

        const updates: Record<string, unknown> = {};
        if (args.title !== undefined) updates.title = args.title.trim();
        if (args.author !== undefined) updates.author = args.author.trim();
        if (args.description !== undefined)
            updates.description = args.description.trim();
        const nextGenres = args.genres !== undefined
            ? normalizeGenres(args.genres)
            : (book.genres ?? []);
        if (args.genres !== undefined) updates.genres = nextGenres;
        const detectedGenre = detectGenre(
            (args.title ?? book.title),
            (args.description ?? book.description)
        );
        let nextGenre = normalizeSingleGenre(args.genre);
        if (!nextGenre) {
            nextGenre = detectedGenre;
        }
        if (!nextGenre) {
            if (args.genres !== undefined) {
                nextGenre = nextGenres[0];
            } else {
                nextGenre = book.genre ?? book.genres?.[0];
            }
        }

        if (!nextGenre) {
            nextGenre = "Education"; // final fallback
        }

        if (
            args.genre !== undefined ||
            args.genres !== undefined ||
            args.title !== undefined ||
            args.description !== undefined
        ) {
            updates.genre = nextGenre;
        }
        if (args.rating !== undefined) updates.rating = normalizeRating(args.rating);
        if (args.ratingCount !== undefined) {
            updates.ratingCount = normalizeNonNegativeInt(args.ratingCount, 0);
        }
        if (args.bookViews !== undefined) {
            updates.bookViews = normalizeNonNegativeInt(args.bookViews, 0);
        }
        if (args.bookRentals !== undefined) {
            updates.bookRentals = normalizeNonNegativeInt(args.bookRentals, 0);
        }
        if (args.pageCount !== undefined) {
            updates.pageCount = normalizeOptionalPositiveInt(args.pageCount, "Page count");
        }
        if (args.publishedYear !== undefined) {
            updates.publishedYear = normalizePublishedYear(args.publishedYear);
        }
        if (args.publisher !== undefined) {
            updates.publisher = args.publisher.trim() || undefined;
        }
        if (args.isbn !== undefined) {
            updates.isbn = args.isbn.replace(/[-\s]/g, "").trim().toUpperCase() || undefined;
        }
        if (args.isTop10 !== undefined || args.top10Position !== undefined) {
            const nextIsTop10 = args.isTop10 ?? Boolean(book.isTop10);
            updates.isTop10 = nextIsTop10;
            updates.top10Position = normalizeTop10Position(
                nextIsTop10,
                args.top10Position ?? book.top10Position
            );
        }
        if (args.isFamous !== undefined) updates.isFamous = args.isFamous;
        if (args.isTrending !== undefined) updates.isTrending = args.isTrending;
        if (args.series !== undefined) updates.series = normalizeSeries(args.series);
        if (args.seriesId !== undefined) updates.seriesId = args.seriesId;
        if (args.rentPerDay !== undefined) updates.rentPerDay = args.rentPerDay;

        if (args.coverImage !== undefined && book.coverImage && args.coverImage !== book.coverImage) {
            await ctx.storage.delete(book.coverImage);
            updates.coverImage = args.coverImage;
        } else if (args.coverImage !== undefined) {
            updates.coverImage = args.coverImage;
        }

        if (args.coverImages !== undefined) {
            if (book.coverImages) {
                const removedIds = book.coverImages.filter(
                    (id) => !args.coverImages!.includes(id)
                );
                for (const id of removedIds) {
                    await ctx.storage.delete(id);
                }
            }
            updates.coverImages = args.coverImages;
        }

        if (args.totalCopies !== undefined) {
            const diff = args.totalCopies - book.totalCopies;
            const nextAvailable = Math.max(0, book.availableCopies + diff);

            updates.totalCopies = args.totalCopies;
            updates.availableCopies = nextAvailable;

            if (book.availableCopies === 0 && nextAvailable > 0) {
                await ctx.scheduler.runAfter(0, internal.notifications.notifySubscribersOfAvailability, {
                    bookId: args.bookId,
                    bookTitle: book.title,
                });
            }
        }

        if (
            args.title !== undefined ||
            args.author !== undefined ||
            args.isbn !== undefined ||
            args.genre !== undefined ||
            args.genres !== undefined
        ) {
            updates.searchText = buildSearchText({
                title: (updates.title as string | undefined) ?? book.title,
                author: (updates.author as string | undefined) ?? book.author,
                isbn: (updates.isbn as string | undefined) ?? book.isbn,
                genre: (updates.genre as string | undefined) ?? book.genre,
                genres: (updates.genres as string[] | undefined) ?? (book.genres ?? []),
            });
        }

        if (
            args.rating !== undefined ||
            args.bookViews !== undefined ||
            args.bookRentals !== undefined
        ) {
            updates.rankingScore = calculateRankingScore({
                rating: (updates.rating as number | undefined) ?? normalizeRating(book.rating),
                bookRentals:
                    (updates.bookRentals as number | undefined) ??
                    normalizeNonNegativeInt(book.bookRentals, 0),
                bookViews:
                    (updates.bookViews as number | undefined) ??
                    normalizeNonNegativeInt(book.bookViews, 0),
            });
        }

        await ctx.db.patch(args.bookId, updates);

        await insertAuditLog(ctx, "book_updated", admin._id, args.bookId, "book", {
            title: args.title ?? book.title
        });
    },
});

export const generateUploadUrl = mutation({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        const admin = await assertAdmin(ctx, args.accessToken);
        const uploadKey = buildRateLimitKey("book", "upload", admin._id);
        await assertRateLimit(ctx, uploadKey, BOOK_RATE_LIMITS.uploadUrl);

        return await ctx.storage.generateUploadUrl();
    },
});

export const remove = mutation({
    args: { bookId: v.id("books"), accessToken: v.string() },
    handler: async (ctx, args) => {
        const admin = await assertAdmin(ctx, args.accessToken);
        const book = await ctx.db.get(args.bookId);
        if (!book) throw new Error("Book not found.");

        const activeRentals = await ctx.db
            .query("rentals")
            .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
            .filter((q) => q.neq(q.field("status"), "returned"))
            .first();
        if (activeRentals) {
            throw new Error("Cannot remove book with active rentals.");
        }

        if (book.coverImage) {
            await ctx.storage.delete(book.coverImage);
        }

        if (book.coverImages) {
            for (const imageId of book.coverImages) {
                await ctx.storage.delete(imageId);
            }
        }

        await ctx.db.delete(args.bookId);
    },
});

export const backfillSearchFields = mutation({
    args: {
        accessToken: v.string(),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const admin = await assertAdmin(ctx, args.accessToken);
        const results = await ctx.db
            .query("books")
            .order("asc")
            .paginate(args.paginationOpts);
        const books = results.page;
        let updated = 0;

        for (const book of books) {
            const normalizedGenres = normalizeGenres(book.genres ?? []);
            const genre = normalizeSingleGenre(book.genre) ?? normalizedGenres[0];
            const rating = normalizeRating(book.rating);
            const ratingCount = normalizeNonNegativeInt(book.ratingCount, 0);
            const bookViews = normalizeNonNegativeInt(book.bookViews, 0);
            const bookRentals = normalizeNonNegativeInt(book.bookRentals, 0);
            const rankingScore = calculateRankingScore({
                rating,
                bookRentals,
                bookViews,
            });
            const searchText = buildSearchText({
                title: book.title,
                author: book.author,
                isbn: book.isbn,
                genre,
                genres: normalizedGenres,
            });

            const needsPatch =
                book.genre !== genre ||
                JSON.stringify(book.genres ?? []) !== JSON.stringify(normalizedGenres) ||
                (book.rating ?? 0) !== rating ||
                (book.ratingCount ?? 0) !== ratingCount ||
                (book.bookViews ?? 0) !== bookViews ||
                (book.bookRentals ?? 0) !== bookRentals ||
                book.rankingScore !== rankingScore ||
                book.searchText !== searchText;

            if (!needsPatch) {
                continue;
            }

            await ctx.db.patch(book._id, {
                genre,
                genres: normalizedGenres,
                rating,
                ratingCount,
                bookViews,
                bookRentals,
                rankingScore,
                searchText,
            });
            updated += 1;
        }

        await insertAuditLog(ctx, "books_search_backfilled", admin._id, undefined, undefined, { updated, scanned: books.length });

        return {
            scanned: books.length,
            updated,
            continueCursor: results.continueCursor,
            isDone: results.isDone,
        };
    },
});
