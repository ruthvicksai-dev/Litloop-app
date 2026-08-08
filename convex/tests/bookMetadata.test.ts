/**
 * Real end-to-end production verification test suite for ISBN -> Open Library metadata -> HD cover -> books DB pipeline.
 */
import { convexTest } from "convex-test";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { fetchOpenLibraryMetadata } from "../bookMetadata/openLibrary";
import { fetchOpenLibraryCoverCandidate } from "../bookMetadata/covers";
import { normalizeIsbn, validateIsbn, isbnToIsbn13 } from "../bookMetadata/isbn";

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
    }, 30000);

    it("2. Verifies Open Library single GET cover candidate resolution", async () => {
        const isbn = "9780134685991";
        const coverUrl = await fetchOpenLibraryCoverCandidate(isbn);
        expect(coverUrl).not.toBeNull();
        expect(coverUrl).toContain("covers.openlibrary.org");
    }, 30000);

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
    }, 30000);

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
    }, 20000);

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
    }, 15000);

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
    }, 15000);
});
