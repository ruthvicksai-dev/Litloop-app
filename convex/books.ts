import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

const MAIN_GENRES = [
    "Action",
    "Adventure",
    "Thriller",
    "Mystery",
    "Fantasy",
    "Sci-Fi",
    "Romance",
    "Horror",
    "Biography",
    "History",
    "Self Help",
    "Rom com",
    "Education",
    "Business",
    "Psychology",
];

const GENRE_KEYWORDS: Record<string, string[]> = {
    Romance: ["love", "relationship", "romance", "affair", "couple", "heart", "emotion"],
    Thriller: ["murder", "crime", "killer", "investigation", "suspense", "police"],
    Fantasy: ["magic", "dragon", "kingdom", "wizard", "myth", "power"],
    "Sci-Fi": ["space", "future", "robot", "alien", "technology"],
    Horror: ["ghost", "haunted", "fear", "dark"],
    Mystery: ["mystery", "detective", "case"],
    Biography: ["life", "story", "journey"],
    Business: ["startup", "money", "finance"],
    Psychology: ["mind", "behavior"],
    "Self Help": ["habit", "growth", "improve"],
};

function detectGenre(title: string, description: string): string | undefined {
    const text = (title + " " + description).toLowerCase();
    const words = text.split(/\W+/).map(w => w.replace(/(ing|ed|s)$/, "")); // 🔥 normalize

    let bestMatch: string | undefined;
    let maxScore = 0;

    for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
        let score = 0;

        for (const keyword of keywords) {
            const key = keyword.toLowerCase();
            if (words.includes(key)) score += 2;
            if (text.includes(key)) score += 1;
        }
        if (genre === "Romance") {
            score *= 0.8;
        }
        if (score > maxScore || (score === maxScore && genre !== "Romance")) {
            maxScore = score;
            bestMatch = genre;
        }
    }
    return maxScore >= 2 ? bestMatch : undefined;
}

function normalizeGenres(genres: string[] | undefined) {
    return Array.from(
        new Set(
            (genres ?? [])
                .map((genre) => genre.trim())
                .filter((genre) => MAIN_GENRES.includes(genre))
                .filter(Boolean)
        )
    ).slice(0, 3);
}

function normalizeBookValue(value: string): string {
    return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeSingleGenre(genre: string | undefined): string | undefined {
    if (!genre) return undefined;
    const normalized = genre.trim();
    return MAIN_GENRES.includes(normalized) ? normalized : undefined;
}

function buildSearchText(input: {
    title: string;
    author: string;
    genre?: string;
    genres?: string[];
}) {
    const tokens = [
        input.title,
        input.author,
        input.genre ?? "",
        ...(input.genres ?? []),
    ]
        .map(normalizeBookValue)
        .filter(Boolean);

    return Array.from(new Set(tokens)).join(" ");
}

function normalizeRating(rating: number | undefined) {
    if (rating === undefined) return 0;
    if (!Number.isFinite(rating)) return 0;
    return Math.max(0, Math.min(5, rating));
}

function calculateRankingScore(book: {
    rating?: number;
    bookRentals?: number;
    bookViews?: number;
}) {
    return (book.rating ?? 0) * 0.5 +
        (book.bookRentals ?? 0) * 0.3 +
        (book.bookViews ?? 0) * 0.2;
}

function normalizeOptionalPositiveInt(value: number | undefined, fieldLabel: string) {
    if (value === undefined) return undefined;
    if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) {
        throw new Error(`${fieldLabel} must be a positive whole number.`);
    }
    return value;
}

function normalizeNonNegativeInt(value: number | undefined, fallback = 0) {
    if (value === undefined) return fallback;
    if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
        throw new Error("Value must be a non-negative whole number.");
    }
    return value;
}

function normalizePublishedYear(value: number | undefined) {
    if (value === undefined) return undefined;
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
        throw new Error("Published year must be a valid year.");
    }
    const currentYear = new Date().getFullYear();
    if (value < 1400 || value > currentYear + 1) {
        throw new Error("Published year must be a valid year.");
    }
    return value;
}

function normalizeTop10Position(
    isTop10: boolean | undefined,
    top10Position: number | undefined
) {
    if (!isTop10) return undefined;
    if (top10Position === undefined) {
        throw new Error("Top 10 position is required when Top 10 is selected.");
    }
    if (!Number.isInteger(top10Position) || top10Position < 1 || top10Position > 10) {
        throw new Error("Top 10 position must be between 1 and 10.");
    }
    return top10Position;
}

function normalizeSeries(series: string | undefined) {
    if (series === undefined) return undefined;
    const normalized = series.trim();
    return normalized || undefined;
}

async function resolveCoverUrls(
    ctx: any,
    book: {
        coverImage?: any;
        coverImages?: any[];
    }
): Promise<{ coverUrl: string | null; coverUrls: string[] }> {
    let coverUrl: string | null = null;
    const coverUrls: string[] = [];

    if (book.coverImages && book.coverImages.length > 0) {
        for (const curr of book.coverImages) {
            const url = await ctx.storage.getUrl(curr as any);
            if (url) coverUrls.push(url);
        }
        if (coverUrls.length > 0) coverUrl = coverUrls[0];
    } else if (book.coverImage) {
        coverUrl = await ctx.storage.getUrl(book.coverImage as any);
        if (coverUrl) coverUrls.push(coverUrl);
    }

    return { coverUrl, coverUrls };
}

export async function mapBookForClient(
    ctx: any,
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

export const incrementBookViews = mutation({
    args: { bookId: v.id("books") },
    handler: async (ctx, args) => {
        const book = await ctx.db.get(args.bookId);
        if (!book) {
            throw new Error("Book not found.");
        }

        const nextBookViews = normalizeNonNegativeInt(book.bookViews, 0) + 1;

        await ctx.db.patch(args.bookId, {
            bookViews: nextBookViews,
            rankingScore: calculateRankingScore({
                rating: normalizeRating(book.rating),
                bookRentals: normalizeNonNegativeInt(book.bookRentals, 0),
                bookViews: nextBookViews,
            }),
        });

        return true;
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
                    const searched = q.search("searchText", normalizedSearch);
                    return selectedGenre ? searched.eq("genre", selectedGenre) : searched;
                })
                .paginate(args.paginationOpts);

            return {
                ...results,
                page: await Promise.all(results.page.map((book) => mapBookForClient(ctx, book))),
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
    },
    handler: async (ctx, args) => {
        const title = args.title.trim();
        const author = args.author.trim();
        const description = args.description.trim();

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
            isTop10,
            top10Position,
            isFamous: Boolean(args.isFamous),
            isTrending: Boolean(args.isTrending),
            series: normalizeSeries(args.series),
            seriesId: args.seriesId,
            searchText: buildSearchText({
                title,
                author,
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
    },
    handler: async (ctx, args) => {
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

        // Cleanup storage for single cover image if replaced
        if (args.coverImage !== undefined && book.coverImage && args.coverImage !== book.coverImage) {
            await ctx.storage.delete(book.coverImage);
            updates.coverImage = args.coverImage;
        } else if (args.coverImage !== undefined) {
            updates.coverImage = args.coverImage;
        }

        // Cleanup storage for multiple cover images if removed/shuffled
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

            // If it was out of stock and now is available, notify
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
            args.genre !== undefined ||
            args.genres !== undefined
        ) {
            updates.searchText = buildSearchText({
                title: (updates.title as string | undefined) ?? book.title,
                author: (updates.author as string | undefined) ?? book.author,
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

export const backfillSearchFields = mutation({
    args: {},
    handler: async (ctx) => {
        const books = await ctx.db.query("books").collect();
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

        return { scanned: books.length, updated };
    },
});