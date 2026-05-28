import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "../_generated/server";
import { assertAdmin } from "../lib/authHelpers";
import { mapBookForClient } from "../lib/bookHelpers";
import { normalizeBookValue, normalizeSingleGenre } from "./helpers";

export const list = query({
    args: { paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        const results = await ctx.db
            .query("books")
            .withIndex("by_createdAt")
            .order("desc")
            .paginate(args.paginationOpts);

        return {
            ...results,
            page: await Promise.all(results.page.map((book) => mapBookForClient(ctx, book))),
        };
    },
});

export const get = query({
    args: { bookId: v.id("books") },
    handler: async (ctx, args) => {
        const book = await ctx.db.get(args.bookId);
        if (!book) return null;

        return mapBookForClient(ctx, book);
    },
});

export const getRelatedBooks = query({
    args: { bookId: v.id("books") },
    handler: async (ctx, args) => {
        const currentBook = await ctx.db.get(args.bookId);
        if (!currentBook) return [];

        const candidateBooks = await ctx.db
            .query("books")
            .withIndex("by_rankingScore")
            .order("desc")
            .take(50);

        const currentAuthorKey = normalizeBookValue(currentBook.author);
        const currentGenres = new Set([
            ...(currentBook.genre ? [currentBook.genre] : []),
            ...(currentBook.genres ?? []),
        ]);

        const sameAuthor = candidateBooks.filter(
            (book) =>
                book._id !== currentBook._id &&
                normalizeBookValue(book.author) === currentAuthorKey
        );

        const sameAuthorIds = new Set(sameAuthor.map((book) => book._id));

        const sameGenre = candidateBooks.filter((book) => {
            if (book._id === currentBook._id) return false;
            if (sameAuthorIds.has(book._id)) return false;

            const bookGenres = [
                ...(book.genre ? [book.genre] : []),
                ...(book.genres ?? []),
            ];

            return bookGenres.some((genre) => currentGenres.has(genre));
        });

        return Promise.all(
            [...sameAuthor, ...sameGenre]
                .slice(0, 8)
                .map((book) => mapBookForClient(ctx, book))
        );
    },
});

export const searchBooks = query({
    args: {
        searchText: v.optional(v.string()),
        genre: v.optional(v.string()),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const normalizedSearch = normalizeBookValue(args.searchText ?? "");
        const selectedGenre = normalizeSingleGenre(args.genre);

        if (normalizedSearch) {
            const results = await ctx.db
                .query("books")
                .withSearchIndex("search_books", (q) => {
                    return q.search("searchText", normalizedSearch);
                })
                .paginate(args.paginationOpts);

            const filteredPage = selectedGenre
                ? results.page.filter((book) => {
                    const bookGenres = [
                        ...(book.genre ? [book.genre] : []),
                        ...(book.genres ?? []),
                    ];
                    return bookGenres.some(
                        (g) => g.toLowerCase() === selectedGenre.toLowerCase()
                    );
                })
                : results.page;

            return {
                ...results,
                page: await Promise.all(filteredPage.map((book) => mapBookForClient(ctx, book))),
            };
        }

        const queryBuilder = selectedGenre
            ? ctx.db.query("books").withIndex("by_genre", (q) => q.eq("genre", selectedGenre))
            : ctx.db.query("books").withIndex("by_createdAt");

        const results = await queryBuilder.order("desc").paginate(args.paginationOpts);

        return {
            ...results,
            page: await Promise.all(results.page.map((book) => mapBookForClient(ctx, book))),
        };
    },
});

export const getBooksByGenre = query({
    args: {
        genre: v.string(),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const selectedGenre = normalizeSingleGenre(args.genre);
        if (!selectedGenre) throw new Error("Invalid genre.");

        const results = await ctx.db
            .query("books")
            .withIndex("by_genre", (q) => q.eq("genre", selectedGenre))
            .order("desc")
            .paginate(args.paginationOpts);

        return {
            ...results,
            page: await Promise.all(results.page.map((book) => mapBookForClient(ctx, book))),
        };
    },
});

export const getTopPicks = query({
    args: {},
    handler: async (ctx) => {
        const books = await ctx.db
            .query("books")
            .withIndex("by_rating")
            .order("desc")
            .take(10);
        return Promise.all(books.map((book) => mapBookForClient(ctx, book)));
    },
});

export const getTop10Books = query({
    args: {},
    handler: async (ctx) => {
        const books = await ctx.db
            .query("books")
            .withIndex("by_isTop10", (q) => q.eq("isTop10", true))
            .take(10);

        const sorted = books
            .filter((b) => typeof b.top10Position === "number")
            .sort((a, b) => (a.top10Position ?? 99) - (b.top10Position ?? 99));

        return Promise.all(sorted.map((book) => mapBookForClient(ctx, book)));
    },
});

export const getTrendingBooks = query({
    args: {},
    handler: async (ctx) => {
        const books = await ctx.db
            .query("books")
            .withIndex("by_rankingScore")
            .order("desc")
            .take(10);
        return Promise.all(books.map((book) => mapBookForClient(ctx, book)));
    },
});

export const getFamousBooks = query({
    args: {},
    handler: async (ctx) => {
        const books = await ctx.db
            .query("books")
            .withIndex("by_isFamous", (q) => q.eq("isFamous", true))
            .order("desc")
            .take(10);
        return Promise.all(books.map((book) => mapBookForClient(ctx, book)));
    },
});

export const getSeriesBooks = query({
    args: {},
    handler: async (ctx) => {
        const series = await ctx.db.query("book_series").order("desc").take(15);

        const seriesWithBooks = await Promise.all(series.map(async (s) => {
            const books = await ctx.db
                .query("books")
                .withIndex("by_seriesId", (q) => q.eq("seriesId", s._id))
                .take(10);

            const coverUrl = await ctx.storage.getUrl(s.coverImage);
            const mappedBooks = await Promise.all(books.map(b => mapBookForClient(ctx, b)));

            return {
                ...s,
                coverUrl,
                books: mappedBooks,
            };
        }));

        return seriesWithBooks.filter(s => s.books.length > 0);
    },
});

export const getNewlyAddedBooks = query({
    args: {},
    handler: async (ctx) => {
        const books = await ctx.db
            .query("books")
            .withIndex("by_createdAt")
            .order("desc")
            .take(10);
        return Promise.all(books.map((book) => mapBookForClient(ctx, book)));
    },
});

export const getProblemBooks = query({
    args: {
        accessToken: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);
        const limit = Math.min(Math.max(args.limit ?? 20, 1), 50);

        const lowRatedCandidates = await ctx.db
            .query("books")
            .withIndex("by_rating")
            .order("asc")
            .take(100);
        const recentCandidates = await ctx.db
            .query("books")
            .withIndex("by_createdAt")
            .order("desc")
            .take(100);
        const booksById = new Map();
        for (const book of [...lowRatedCandidates, ...recentCandidates]) {
            booksById.set(book._id, book);
        }

        const problemBooks = [...booksById.values()].filter(b => {
            const avgRating = b.avgRating ?? b.rating ?? 0;
            const flaggedCount = b.flaggedCount ?? 0;
            return (avgRating > 0 && avgRating < 3) || flaggedCount > 0;
        }).slice(0, limit);

        return Promise.all(problemBooks.map(b => mapBookForClient(ctx, b)));
    },
});

/**
 * Consolidated discover query — replaces 6 individual subscriptions with 1.
 * Reduces per-user WebSocket subscriptions from ~8 to ~3-4.
 */
export const getDiscoverData = query({
    args: {},
    handler: async (ctx) => {
        // Top Picks — by rating desc
        const topPicksRaw = await ctx.db
            .query("books")
            .withIndex("by_rating")
            .order("desc")
            .take(5);

        // Top 10 — curated list (kept at 10 since this is a fixed curated list)
        const top10Raw = await ctx.db
            .query("books")
            .withIndex("by_isTop10", (q) => q.eq("isTop10", true))
            .take(10);
        const top10Sorted = top10Raw
            .filter((b) => typeof b.top10Position === "number")
            .sort((a, b) => (a.top10Position ?? 99) - (b.top10Position ?? 99));

        // Trending — by ranking score desc
        const trendingRaw = await ctx.db
            .query("books")
            .withIndex("by_rankingScore")
            .order("desc")
            .take(5);

        // Famous — flagged books
        const famousRaw = await ctx.db
            .query("books")
            .withIndex("by_isFamous", (q) => q.eq("isFamous", true))
            .order("desc")
            .take(5);

        // Newly Added — latest by creation
        const newlyAddedRaw = await ctx.db
            .query("books")
            .withIndex("by_createdAt")
            .order("desc")
            .take(5);

        // Series
        const seriesRaw = await ctx.db.query("book_series").order("desc").take(8);
        const seriesWithBooks = await Promise.all(seriesRaw.map(async (s) => {
            const books = await ctx.db
                .query("books")
                .withIndex("by_seriesId", (q) => q.eq("seriesId", s._id))
                .take(5);
            const coverUrl = await ctx.storage.getUrl(s.coverImage);
            const mappedBooks = await Promise.all(books.map((b) => mapBookForClient(ctx, b)));
            return { ...s, coverUrl, books: mappedBooks };
        }));

        // Map all simple sections in parallel
        const [topPicks, top10Books, trendingBooks, famousBooks, newlyAddedBooks] =
            await Promise.all([
                Promise.all(topPicksRaw.map((b) => mapBookForClient(ctx, b))),
                Promise.all(top10Sorted.map((b) => mapBookForClient(ctx, b))),
                Promise.all(trendingRaw.map((b) => mapBookForClient(ctx, b))),
                Promise.all(famousRaw.map((b) => mapBookForClient(ctx, b))),
                Promise.all(newlyAddedRaw.map((b) => mapBookForClient(ctx, b))),
            ]);

        return {
            topPicks,
            top10Books,
            trendingBooks,
            famousBooks,
            newlyAddedBooks,
            seriesBooks: seriesWithBooks.filter((s) => s.books.length > 0),
        };
    },
});
