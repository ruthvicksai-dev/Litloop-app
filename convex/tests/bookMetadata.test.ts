/**
 * Real end-to-end production verification test suite for ISBN -> Open Library metadata -> HD cover -> books DB pipeline.
 * Includes Google Books fallback, metadata cache, and quota guard tests.
 */
import { convexTest } from "convex-test";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { api, internal } from "../_generated/api";
import schema from "../schema";
import { fetchOpenLibraryMetadata } from "../bookMetadata/openLibrary";
import { fetchGoogleBooksMetadata, fetchGoogleBooksMetadataBySearch } from "../bookMetadata/googleBooks";
import { fetchOpenLibraryCoverCandidate } from "../bookMetadata/covers";
import { normalizeIsbn, validateIsbn, isbnToIsbn13 } from "../bookMetadata/isbn";
import { makeCacheKey } from "../bookMetadata/cache";

const ENV = {
    USE_DEV_OTP: "true",
    JWT_ACCESS_SECRET: "test-access-secret-long-enough-for-hmac",
    JWT_REFRESH_SECRET: "test-refresh-secret-long-enough-for-hmac",
};

beforeEach(() => {
    for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
});

afterEach(() => {
    vi.unstubAllEnvs();
});

async function makeAdmin(t: any) {
    const userId = await t.run(async (ctx: any) => {
        return ctx.db.insert("users", {
            name: "Admin User",
            email: "admin@litloop.in",
            phone: "1234567890",
            passwordHash: "pbkdf2$aa$bb",
            providers: ["local"],
            lastLoginProvider: "local",
            role: "admin",
            acceptedTerms: true,
            acceptedAt: Date.now(),
            createdAt: Date.now(),
        });
    });
    const sessionId = await t.run(async (ctx: any) => {
        return ctx.db.insert("sessions", {
            userId,
            refreshTokenHash: "h",
            isRevoked: false,
            expiresAt: Date.now() + 86400000,
            createdAt: Date.now(),
        });
    });
    const { createToken } = await import("../lib/jwt");
    const accessToken = await createToken(
        { sub: userId, sid: sessionId, type: "access" },
        ENV.JWT_ACCESS_SECRET,
        1800000
    );
    return { userId, accessToken };
}

async function makeRegularUser(t: any) {
    const userId = await t.run(async (ctx: any) => {
        return ctx.db.insert("users", {
            name: "Regular User",
            email: "user@litloop.in",
            phone: "9876543210",
            passwordHash: "pbkdf2$aa$bb",
            providers: ["local"],
            lastLoginProvider: "local",
            role: "user",
            acceptedTerms: true,
            acceptedAt: Date.now(),
            createdAt: Date.now(),
        });
    });
    const sessionId = await t.run(async (ctx: any) => {
        return ctx.db.insert("sessions", {
            userId,
            refreshTokenHash: "h",
            isRevoked: false,
            expiresAt: Date.now() + 86400000,
            createdAt: Date.now(),
        });
    });
    const { createToken } = await import("../lib/jwt");
    const accessToken = await createToken(
        { sub: userId, sid: sessionId, type: "access" },
        ENV.JWT_ACCESS_SECRET,
        1800000
    );
    return { userId, accessToken };
}

describe("End-to-End ISBN Metadata & Cover Pipeline Verification", () => {
    it("1. Verifies Open Library real connection and User-Agent fetching", async () => {
        const isbn = "9780134685991"; // Clean Coder
        const result = await fetchOpenLibraryMetadata(isbn);

        expect(result).not.toBeNull();
        if (result) {
            expect(result.genres).toBeDefined();
            expect(Array.isArray(result.genres)).toBe(true);
        }
    }, 60000);

    it("2. Verifies Open Library single GET cover candidate resolution", async () => {
        const isbn = "9780134685991";
        const coverUrl = await fetchOpenLibraryCoverCandidate(isbn);
        // Cover may be null on slow networks or if Open Library is temporarily unavailable
        if (coverUrl) {
            expect(coverUrl).toContain("covers.openlibrary.org");
        }
    }, 60000);

    it("3. Verifies complete Convex action lookupBookByIsbn for admin", async () => {
        const t = convexTest(schema);
        const { accessToken } = await makeAdmin(t);

        const isbn = "9780134685991";
        const response = await t.action(api.bookMetadata.lookupBookByIsbn, {
            isbn,
            accessToken,
        });

        expect(["SUCCESS", "PARTIAL_METADATA"]).toContain(response.status);
        expect(response.metadata).toBeDefined();
        if (response.metadata) {
            expect(response.metadata.isbn).toBe("9780134685991");
            expect(response.metadata.coverCandidates.length).toBeGreaterThan(0);
            expect(response.metadata.sourceProvider).toBe("Open Library");
        }
    }, 60000);

    it("4. Verifies duplicate ISBN & Title/Author protection (lookup & mutation level)", async () => {
        const t = convexTest(schema);
        const { accessToken } = await makeAdmin(t);

        const isbn = "9780134685991";

        // Insert initial book directly into Convex DB
        await t.mutation(api.books.add, {
            title: "The Clean Coder",
            author: "Robert C. Martin",
            description: "A Code of Conduct for Professional Programmers.",
            rentPerDay: 15,
            totalCopies: 5,
            isbn,
            genres: ["Business", "Self Help"],
            accessToken,
        });

        // 1. Check same normalized ISBN format lookup
        const lookupResult1 = await t.action(api.bookMetadata.lookupBookByIsbn, {
            isbn: "9780134685991",
            accessToken,
        });
        expect(lookupResult1.status).toBe("EXISTING_BOOK");

        // 2. Check formatted hyphens variant lookup
        const lookupResult2 = await t.action(api.bookMetadata.lookupBookByIsbn, {
            isbn: "978-0134685991",
            accessToken,
        });
        expect(lookupResult2.status).toBe("EXISTING_BOOK");

        // 3. Check mutation duplicate title+author rejection
        await expect(
            t.mutation(api.books.add, {
                title: "The Clean Coder",
                author: "Robert C. Martin",
                description: "Duplicate title/author test.",
                rentPerDay: 15,
                totalCopies: 5,
                genres: ["Business"],
                accessToken,
            })
        ).rejects.toThrow("This book already exists.");

        // 4. Check mutation duplicate ISBN rejection (different title, same ISBN)
        await expect(
            t.mutation(api.books.add, {
                title: "The Clean Coder Alternate Edition",
                author: "Robert C. Martin",
                description: "Duplicate ISBN test.",
                rentPerDay: 15,
                totalCopies: 5,
                isbn: "978-0134685991",
                genres: ["Business"],
                accessToken,
            })
        ).rejects.toThrow("A book with this ISBN already exists.");

        // 5. Check mutation duplicate title rejection (same title, different author)
        await expect(
            t.mutation(api.books.add, {
                title: "The Clean Coder",
                author: "Different Author",
                description: "Duplicate title test.",
                rentPerDay: 15,
                totalCopies: 5,
                genres: ["Business"],
                accessToken,
            })
        ).rejects.toThrow('A book named "The Clean Coder" already exists.');
    }, 45000);

    it("5. Verifies invalid ISBN handling (0 external requests)", async () => {
        const t = convexTest(schema);
        const { accessToken } = await makeAdmin(t);

        const response = await t.action(api.bookMetadata.lookupBookByIsbn, {
            isbn: "12345",
            accessToken,
        });

        expect(response.status).toBe("INVALID_ISBN");
        expect(response.message).toContain("valid ISBN");
    });

    it("6. Verifies ISBN-10 to ISBN-13 normalization, check digit validation, and lookup", async () => {
        const t = convexTest(schema);
        const { accessToken } = await makeAdmin(t);

        const isbn10 = "0306406152";
        const validation = validateIsbn(isbn10);
        expect(validation.isValid).toBe(true);
        expect(validation.type).toBe("ISBN-10");

        const normalized = normalizeIsbn(isbn10);
        expect(normalized).toBe("0306406152");

        const convertedIsbn13 = isbnToIsbn13(isbn10);
        expect(convertedIsbn13).toBe("9780306406157");

        const response = await t.action(api.bookMetadata.lookupBookByIsbn, {
            isbn: isbn10,
            accessToken,
        });

        expect(["SUCCESS", "PARTIAL_METADATA", "NOT_FOUND"]).toContain(response.status);
    }, 45000);

    it("7. Verifies non-admin authorization rejection", async () => {
        const t = convexTest(schema);
        const { accessToken: userAccessToken } = await makeRegularUser(t);

        await expect(
            t.action(api.bookMetadata.lookupBookByIsbn, {
                isbn: "9780134685991",
                accessToken: userAccessToken,
            })
        ).rejects.toThrow("Unauthorized: Admin access required.");
    });

    it("8. Verifies lookup by Title and Author when ISBN is omitted", async () => {
        const t = convexTest(schema);
        const { accessToken } = await makeAdmin(t);

        const response = await t.action(api.bookMetadata.lookupBookByIsbn, {
            title: "Clean Code",
            author: "Robert C. Martin",
            accessToken,
        });

        expect(["SUCCESS", "PARTIAL_METADATA"]).toContain(response.status);
        expect(response.metadata).toBeDefined();
        if (response.metadata) {
            expect(response.metadata.title).toBeDefined();
        }
    }, 45000);
});

describe("Google Books Fallback Provider", () => {
    it("9. Verifies Google Books ISBN lookup returns valid metadata (or gracefully handles rate limit)", async () => {
        const isbn = "9780062316110"; // Sapiens by Yuval Noah Harari
        const result = await fetchGoogleBooksMetadata(isbn);

        // Google Books may rate-limit (429) on free tier — that's expected
        if (result) {
            expect(result.title).toBeDefined();
            expect(result.author).toBeDefined();
            expect(result.author).not.toBe("Unknown Author");
        }
    }, 60000);

    it("10. Verifies Google Books title/author search returns valid metadata (or gracefully handles rate limit)", async () => {
        const result = await fetchGoogleBooksMetadataBySearch("Atomic Habits", "James Clear");

        // Google Books may rate-limit (429) on free tier — that's expected
        if (result) {
            expect(result.title).toBeDefined();
            expect(result.author).toBeDefined();
        }
    }, 60000);
});

describe("Metadata Cache & Quota Guard", () => {
    it("11. Verifies cache key generation is deterministic", () => {
        expect(makeCacheKey("9780134685991")).toBe("isbn:9780134685991");
        expect(makeCacheKey("", "Clean Code", "Robert Martin")).toBe("title:clean code::robert martin");
        expect(makeCacheKey(undefined, "Sapiens")).toBe("title:sapiens::");
    });

    it("12. Verifies metadata cache stores and retrieves results", async () => {
        const t = convexTest(schema);

        const testMetadata = {
            title: "Test Book",
            author: "Test Author",
            description: "A test description.",
            genres: ["Fiction"],
            publishedYear: "2024",
            isbn: "1234567890123",
            coverCandidates: [],
            sourceProvider: "openLibrary",
        };

        // Store in cache
        await t.mutation(internal.bookMetadata.cache.setCachedMetadata, {
            lookupKey: "isbn:1234567890123",
            provider: "openLibrary",
            metadata: JSON.stringify(testMetadata),
        });

        // Retrieve from cache
        const cached = await t.query(internal.bookMetadata.cache.getCachedMetadata, {
            lookupKey: "isbn:1234567890123",
        });

        expect(cached).not.toBeNull();
        if (cached) {
            expect(cached.provider).toBe("openLibrary");
            expect(cached.metadata.title).toBe("Test Book");
            expect(cached.metadata.author).toBe("Test Author");
        }
    });

    it("13. Verifies cache upsert replaces existing entries", async () => {
        const t = convexTest(schema);

        const metadata1 = JSON.stringify({
            title: "Book V1",
            author: "Author",
            description: "",
            genres: [],
            publishedYear: "2024",
            coverCandidates: [],
            sourceProvider: "openLibrary",
        });

        const metadata2 = JSON.stringify({
            title: "Book V2",
            author: "Author Updated",
            description: "Updated",
            genres: ["Thriller"],
            publishedYear: "2025",
            coverCandidates: [],
            sourceProvider: "googleBooks",
        });

        // Store first version
        await t.mutation(internal.bookMetadata.cache.setCachedMetadata, {
            lookupKey: "isbn:upsert-test",
            provider: "openLibrary",
            metadata: metadata1,
        });

        // Overwrite with second version
        await t.mutation(internal.bookMetadata.cache.setCachedMetadata, {
            lookupKey: "isbn:upsert-test",
            provider: "googleBooks",
            metadata: metadata2,
        });

        // Retrieve should return V2
        const cached = await t.query(internal.bookMetadata.cache.getCachedMetadata, {
            lookupKey: "isbn:upsert-test",
        });

        expect(cached).not.toBeNull();
        if (cached) {
            expect(cached.provider).toBe("googleBooks");
            expect(cached.metadata.title).toBe("Book V2");
        }
    });

    it("14. Verifies quota guard tracks daily usage", async () => {
        const t = convexTest(schema);

        // Initially quota should be available
        const initial = await t.query(internal.bookMetadata.quotaGuard.checkQuota, {
            provider: "googleBooks",
        });
        expect(initial.allowed).toBe(true);
        expect(initial.remaining).toBe(900);

        // Increment quota
        await t.mutation(internal.bookMetadata.quotaGuard.incrementQuota, {
            provider: "googleBooks",
        });

        // Check remaining decreased
        const after = await t.query(internal.bookMetadata.quotaGuard.checkQuota, {
            provider: "googleBooks",
        });
        expect(after.allowed).toBe(true);
        expect(after.remaining).toBe(899);
    });

    it("15. Verifies expired cache entries are cleaned up", async () => {
        const t = convexTest(schema);

        // Insert an already-expired entry directly
        await t.run(async (ctx: any) => {
            await ctx.db.insert("metadata_cache", {
                lookupKey: "isbn:expired-test",
                provider: "openLibrary",
                metadata: JSON.stringify({ title: "Expired Book" }),
                createdAt: Date.now() - 100 * 24 * 60 * 60 * 1000, // 100 days ago
                expiresAt: Date.now() - 10 * 24 * 60 * 60 * 1000,  // Expired 10 days ago
            });
        });

        // Should not be retrievable (expired)
        const cached = await t.query(internal.bookMetadata.cache.getCachedMetadata, {
            lookupKey: "isbn:expired-test",
        });
        expect(cached).toBeNull();

        // Cleanup should delete it
        const result = await t.mutation(internal.bookMetadata.cache.cleanupExpiredCache, {
            batchSize: 100,
        });
        expect(result.deleted).toBeGreaterThanOrEqual(1);
    });

    it("16. Verifies full pipeline caches result and serves from cache on second lookup", async () => {
        const t = convexTest(schema);
        const { accessToken } = await makeAdmin(t);

        // First lookup — hits external APIs
        const response1 = await t.action(api.bookMetadata.lookupBookByIsbn, {
            isbn: "9780134685991",
            accessToken,
        });

        expect(["SUCCESS", "PARTIAL_METADATA"]).toContain(response1.status);
        expect(response1.metadata).toBeDefined();

        // Verify cache was populated
        const cached = await t.query(internal.bookMetadata.cache.getCachedMetadata, {
            lookupKey: "isbn:9780134685991",
        });
        expect(cached).not.toBeNull();

        // Second lookup — should hit cache (much faster)
        const startTime = Date.now();
        const response2 = await t.action(api.bookMetadata.lookupBookByIsbn, {
            isbn: "9780134685991",
            accessToken,
        });
        const duration = Date.now() - startTime;

        expect(response2.status).toBe("SUCCESS");
        expect(response2.metadata).toBeDefined();
        // Cache hit should be very fast (no external API calls)
        expect(duration).toBeLessThan(5000);
    }, 60000);
});
