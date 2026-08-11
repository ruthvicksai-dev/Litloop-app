import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { getCoverCandidates } from "./covers";
import { makeCacheKey } from "./cache";
import { logLookupEvent } from "./fetchUtils";
import { normalizeIsbn, validateIsbn } from "./isbn";
import { fetchOpenLibraryMetadata, fetchOpenLibraryMetadataBySearch, RawOpenLibraryResult } from "./openLibrary";
import { fetchGoogleBooksMetadata, fetchGoogleBooksMetadataBySearch } from "./googleBooks";
import { LookupResult, NormalizedBookMetadata } from "./types";

export const lookupBookByIsbn = action({
    args: {
        isbn: v.optional(v.string()),
        title: v.optional(v.string()),
        author: v.optional(v.string()),
        accessToken: v.string(),
    },
    handler: async (ctx, args): Promise<LookupResult> => {
        const startTime = Date.now();
        const lookupId = `lookup_${Math.random().toString(36).substring(2, 9)}`;

        const rawIsbn = args.isbn?.trim() || "";
        const rawTitle = args.title?.trim() || "";
        const rawAuthor = args.author?.trim() || "";

        // Normalize & Validate ISBN if provided
        let normalizedIsbn = rawIsbn ? normalizeIsbn(rawIsbn) : "";
        let hasValidIsbn = false;

        if (normalizedIsbn) {
            const validation = validateIsbn(normalizedIsbn);
            hasValidIsbn = validation.isValid;
        }

        // If neither valid ISBN nor Title is provided, reject immediately
        if (!hasValidIsbn && !rawTitle) {
            logLookupEvent({
                lookupId,
                isbn: rawIsbn,
                provider: "local",
                durationMs: Date.now() - startTime,
                status: 400,
                success: false,
                errorCategory: "INVALID_INPUT",
            });
            return {
                status: "INVALID_ISBN",
                message: "Please scan or enter a valid ISBN, or enter a book title to fetch details.",
            };
        }

        // 1. Check database for existing book by ISBN first (if valid ISBN present)
        if (hasValidIsbn) {
            const checkResult = await ctx.runQuery(
                internal.bookMetadata.internal.assertAdminAndCheckIsbn,
                {
                    accessToken: args.accessToken,
                    isbn: normalizedIsbn,
                }
            );

            if (checkResult.existingBook) {
                logLookupEvent({
                    lookupId,
                    isbn: normalizedIsbn,
                    provider: "database",
                    durationMs: Date.now() - startTime,
                    status: 200,
                    success: true,
                    errorCategory: "EXISTING_BOOK",
                });
                return {
                    status: "EXISTING_BOOK",
                    existingBookId: checkResult.existingBook._id,
                    existingBookTitle: checkResult.existingBook.title,
                    existingBookAuthor: checkResult.existingBook.author,
                    message: `Book "${checkResult.existingBook.title}" with this ISBN already exists in your catalog.`,
                };
            }
        }

        // 2. Check database for existing book by Title / Author (if title present)
        if (rawTitle) {
            const titleCheck = await ctx.runQuery(
                internal.bookMetadata.internal.checkBookByTitle,
                {
                    title: rawTitle,
                    author: rawAuthor,
                }
            );

            if (titleCheck) {
                logLookupEvent({
                    lookupId,
                    isbn: normalizedIsbn || "title_search",
                    provider: "database",
                    durationMs: Date.now() - startTime,
                    status: 200,
                    success: true,
                    errorCategory: "EXISTING_BOOK",
                });
                return {
                    status: "EXISTING_BOOK",
                    existingBookId: titleCheck._id,
                    existingBookTitle: titleCheck.title,
                    existingBookAuthor: titleCheck.author,
                    message: `Book "${titleCheck.title}" already exists in your catalog.`,
                };
            }
        }

        // 3. Check metadata cache
        const cacheKey = makeCacheKey(
            hasValidIsbn ? normalizedIsbn : undefined,
            rawTitle,
            rawAuthor
        );

        const cached = await ctx.runQuery(
            internal.bookMetadata.cache.getCachedMetadata,
            { lookupKey: cacheKey }
        );

        if (cached) {
            logLookupEvent({
                lookupId,
                isbn: normalizedIsbn || "title_search",
                provider: `cache(${cached.provider})`,
                durationMs: Date.now() - startTime,
                status: 200,
                success: true,
            });

            return {
                status: "SUCCESS",
                metadata: cached.metadata,
                message: "Book details fetched successfully.",
            };
        }

        // 4. Open Library Metadata Fetch (by ISBN if valid, or by Search)
        try {
            let olData: RawOpenLibraryResult | null = null;

            if (hasValidIsbn) {
                olData = await fetchOpenLibraryMetadata(normalizedIsbn);
            }

            if (!olData && rawTitle) {
                olData = await fetchOpenLibraryMetadataBySearch(rawTitle, rawAuthor);
            }

            if (olData) {
                // If metadata found via title search, check if title/author already exists in database
                if (!hasValidIsbn && olData.title) {
                    const titleCheck = await ctx.runQuery(
                        internal.bookMetadata.internal.checkBookByTitle,
                        {
                            title: olData.title,
                            author: olData.author,
                        }
                    );

                    if (titleCheck) {
                        logLookupEvent({
                            lookupId,
                            isbn: normalizedIsbn || "title_search",
                            provider: "database",
                            durationMs: Date.now() - startTime,
                            status: 200,
                            success: true,
                            errorCategory: "EXISTING_BOOK",
                        });
                        return {
                            status: "EXISTING_BOOK",
                            existingBookId: titleCheck._id,
                            existingBookTitle: titleCheck.title,
                            existingBookAuthor: titleCheck.author,
                            message: `Book "${titleCheck.title}" already exists in your catalog.`,
                        };
                    }
                }

                const effectiveIsbn = normalizedIsbn || olData.isbn13 || olData.isbn10 || "";

                // Cover Pipeline (Open Library Cover → SerpApi HD Fallback)
                const coverCandidates = effectiveIsbn
                    ? await getCoverCandidates(effectiveIsbn, olData.title, olData.author)
                    : [];

                const metadata: NormalizedBookMetadata = {
                    title: olData.title,
                    author: olData.author || "Unknown Author",
                    description: olData.description || "",
                    genres: olData.genres,
                    publishedYear: olData.publishedYear,
                    isbn: effectiveIsbn,
                    isbn10: olData.isbn10,
                    isbn13: olData.isbn13,
                    publisher: olData.publisher,
                    pageCount: olData.pageCount,
                    coverCandidates,
                    descriptionRejectedReason: olData.descriptionRejectedReason,
                    sourceProvider: "Open Library",
                };

                // Cache the result
                await ctx.runMutation(internal.bookMetadata.cache.setCachedMetadata, {
                    lookupKey: cacheKey,
                    provider: "openLibrary",
                    metadata: JSON.stringify(metadata),
                });

                const isPartial = !olData.title || olData.author === "Unknown Author";
                const status = isPartial ? "PARTIAL_METADATA" : "SUCCESS";

                logLookupEvent({
                    lookupId,
                    isbn: effectiveIsbn || "title_search",
                    provider: "openLibrary",
                    durationMs: Date.now() - startTime,
                    status: 200,
                    success: true,
                    fallbackUsed: coverCandidates.length > 0 ? "covers" : undefined,
                });

                return {
                    status,
                    metadata,
                    message: isPartial
                        ? "Partial book details retrieved. Please review and fill in missing fields."
                        : "Book details fetched successfully.",
                };
            }
        } catch (error: any) {
            // Open Library failed — log and fall through to Google Books
            console.warn(`[BookLookup] Open Library failed: ${error.message}`);
        }

        // 5. Google Books Fallback (with quota check)
        try {
            const quotaStatus = await ctx.runQuery(
                internal.bookMetadata.quotaGuard.checkQuota,
                { provider: "googleBooks" }
            );

            if (!quotaStatus.allowed) {
                logLookupEvent({
                    lookupId,
                    isbn: normalizedIsbn || rawTitle,
                    provider: "googleBooks",
                    durationMs: Date.now() - startTime,
                    status: 429,
                    success: false,
                    errorCategory: "QUOTA_EXHAUSTED",
                });

                return {
                    status: "NOT_FOUND",
                    message: "Book details could not be found automatically. Please enter details manually.",
                };
            }

            let gbData: RawOpenLibraryResult | null = null;

            if (hasValidIsbn) {
                gbData = await fetchGoogleBooksMetadata(normalizedIsbn);
            }

            if (!gbData && rawTitle) {
                gbData = await fetchGoogleBooksMetadataBySearch(rawTitle, rawAuthor);
            }

            // Increment quota after API call (whether successful or not)
            await ctx.runMutation(internal.bookMetadata.quotaGuard.incrementQuota, {
                provider: "googleBooks",
            });

            if (!gbData) {
                logLookupEvent({
                    lookupId,
                    isbn: normalizedIsbn || rawTitle,
                    provider: "googleBooks",
                    durationMs: Date.now() - startTime,
                    status: 404,
                    success: false,
                    errorCategory: "NOT_FOUND",
                });
                return {
                    status: "NOT_FOUND",
                    message: "Book details could not be found automatically. Please enter details manually.",
                };
            }

            // If metadata found via title search, check if title/author already exists in database
            if (!hasValidIsbn && gbData.title) {
                const titleCheck = await ctx.runQuery(
                    internal.bookMetadata.internal.checkBookByTitle,
                    {
                        title: gbData.title,
                        author: gbData.author,
                    }
                );

                if (titleCheck) {
                    logLookupEvent({
                        lookupId,
                        isbn: normalizedIsbn || "title_search",
                        provider: "database",
                        durationMs: Date.now() - startTime,
                        status: 200,
                        success: true,
                        errorCategory: "EXISTING_BOOK",
                    });
                    return {
                        status: "EXISTING_BOOK",
                        existingBookId: titleCheck._id,
                        existingBookTitle: titleCheck.title,
                        existingBookAuthor: titleCheck.author,
                        message: `Book "${titleCheck.title}" already exists in your catalog.`,
                    };
                }
            }

            const effectiveIsbn = normalizedIsbn || gbData.isbn13 || gbData.isbn10 || "";

            // Cover Pipeline
            const coverCandidates = effectiveIsbn
                ? await getCoverCandidates(effectiveIsbn, gbData.title, gbData.author)
                : [];

            const metadata: NormalizedBookMetadata = {
                title: gbData.title,
                author: gbData.author || "Unknown Author",
                description: gbData.description || "",
                genres: gbData.genres,
                publishedYear: gbData.publishedYear,
                isbn: effectiveIsbn,
                isbn10: gbData.isbn10,
                isbn13: gbData.isbn13,
                publisher: gbData.publisher,
                pageCount: gbData.pageCount,
                coverCandidates,
                descriptionRejectedReason: gbData.descriptionRejectedReason,
                sourceProvider: "Google Books",
            };

            // Cache the result
            await ctx.runMutation(internal.bookMetadata.cache.setCachedMetadata, {
                lookupKey: cacheKey,
                provider: "googleBooks",
                metadata: JSON.stringify(metadata),
            });

            const isPartial = !gbData.title || gbData.author === "Unknown Author";
            const status = isPartial ? "PARTIAL_METADATA" : "SUCCESS";

            logLookupEvent({
                lookupId,
                isbn: effectiveIsbn || "title_search",
                provider: "googleBooks",
                durationMs: Date.now() - startTime,
                status: 200,
                success: true,
                fallbackUsed: coverCandidates.length > 0 ? "covers" : undefined,
            });

            return {
                status,
                metadata,
                message: isPartial
                    ? "Partial book details retrieved (via Google Books). Please review and fill in missing fields."
                    : "Book details fetched successfully (via Google Books).",
            };
        } catch (error: any) {
            logLookupEvent({
                lookupId,
                isbn: normalizedIsbn || rawTitle,
                provider: "googleBooks",
                durationMs: Date.now() - startTime,
                status: 500,
                success: false,
                errorCategory: error.message,
            });

            return {
                status: "PROVIDER_UNAVAILABLE",
                message: "External book services are temporarily unavailable. Please enter details manually.",
            };
        }
    },
});
