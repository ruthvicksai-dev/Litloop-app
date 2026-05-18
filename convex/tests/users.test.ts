/**
 * Account deletion tests using convex-test.
 *
 * Verifies the 12-step cascading deletion process required by Google Play policy.
 */
import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const ENV = {
  JWT_ACCESS_SECRET: "test-access-secret-long-enough-for-hmac",
  JWT_REFRESH_SECRET: "test-refresh-secret-long-enough-for-hmac",
};

function stubEnv() {
  for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
}

async function makeUser(t: any, overrides: Record<string, any> = {}) {
  const userId = await t.run(async (ctx: any) => {
    return ctx.db.insert("users", {
      name: "Del User", email: "del@test.com", phone: "9876543210",
      passwordHash: "pbkdf2$aa$bb", providers: ["local"],
      lastLoginProvider: "local", role: "user",
      acceptedTerms: true, acceptedAt: Date.now(), createdAt: Date.now(),
      ...overrides,
    });
  });
  const sessionId = await t.run(async (ctx: any) => {
    return ctx.db.insert("sessions", {
      userId, refreshTokenHash: "h", isRevoked: false,
      expiresAt: Date.now() + 86400000, createdAt: Date.now(),
    });
  });
  const { createToken } = await import("../lib/jwt");
  const accessToken = await createToken(
    { sub: userId, sid: sessionId, type: "access" },
    ENV.JWT_ACCESS_SECRET, 1800000
  );
  return { userId, sessionId, accessToken };
}

describe("deleteAccount", () => {
  it("requires DELETE confirmation text", async () => {
    const t = convexTest(schema);
    try {
      stubEnv();
      const user = await makeUser(t);
      await expect(t.mutation(api.users.deleteAccount, {
        accessToken: user.accessToken, confirmText: "wrong",
      })).rejects.toThrow("type DELETE");
    } finally { vi.unstubAllEnvs(); }
  });

  it("blocks deletion when active rentals exist", async () => {
    const t = convexTest(schema);
    try {
      stubEnv();
      const user = await makeUser(t);

      // Create an active rental
      const bookId = await t.run(async (ctx: any) => {
        return ctx.db.insert("books", {
          title: "B", author: "A", description: "D", rentPerDay: 5,
          genre: "Fiction", genres: ["Fiction"], totalCopies: 1,
          availableCopies: 0, rating: 0, ratingCount: 0, createdAt: Date.now(),
        });
      });
      await t.run(async (ctx: any) => {
        return ctx.db.insert("rentals", {
          userId: user.userId, bookId, zone: "College",
          deliveryLocation: { phone: "9876543210", roomNo: "B", rollNo: "R" },
          rentPerDay: 5, status: "requested", createdAt: Date.now(),
        });
      });

      await expect(t.mutation(api.users.deleteAccount, {
        accessToken: user.accessToken, confirmText: "DELETE",
      })).rejects.toThrow("active rentals");
    } finally { vi.unstubAllEnvs(); }
  });

  it("deletes user document on valid deletion", async () => {
    const t = convexTest(schema);
    try {
      stubEnv();
      const user = await makeUser(t);

      const result = await t.mutation(api.users.deleteAccount, {
        accessToken: user.accessToken, confirmText: "DELETE",
      });

      expect(result.success).toBe(true);

      // User should no longer exist
      const deletedUser = await t.run(async (ctx: any) => ctx.db.get(user.userId));
      expect(deletedUser).toBeNull();
    } finally { vi.unstubAllEnvs(); }
  });

  it("revokes all sessions before deletion", async () => {
    const t = convexTest(schema);
    try {
      stubEnv();
      const user = await makeUser(t);

      await t.mutation(api.users.deleteAccount, {
        accessToken: user.accessToken, confirmText: "DELETE",
      });

      // Session should be revoked
      const session = await t.run(async (ctx: any) => ctx.db.get(user.sessionId));
      expect(session.isRevoked).toBe(true);
    } finally { vi.unstubAllEnvs(); }
  });

  it("deletes favorites and read-later items", async () => {
    const t = convexTest(schema);
    try {
      stubEnv();
      const user = await makeUser(t);

      const bookId = await t.run(async (ctx: any) => {
        return ctx.db.insert("books", {
          title: "B", author: "A", description: "D", rentPerDay: 5,
          genre: "Fiction", genres: ["Fiction"], totalCopies: 1,
          availableCopies: 1, rating: 0, ratingCount: 0, createdAt: Date.now(),
        });
      });

      // Add favorites and read-later
      const favId = await t.run(async (ctx: any) => {
        return ctx.db.insert("favorites", {
          userId: user.userId, bookId, createdAt: Date.now(),
        });
      });
      const rlId = await t.run(async (ctx: any) => {
        return ctx.db.insert("read_later", {
          userId: user.userId, bookId, createdAt: Date.now(),
        });
      });

      await t.mutation(api.users.deleteAccount, {
        accessToken: user.accessToken, confirmText: "DELETE",
      });

      const fav = await t.run(async (ctx: any) => ctx.db.get(favId));
      const rl = await t.run(async (ctx: any) => ctx.db.get(rlId));
      expect(fav).toBeNull();
      expect(rl).toBeNull();
    } finally { vi.unstubAllEnvs(); }
  });

  it("deletes notifications", async () => {
    const t = convexTest(schema);
    try {
      stubEnv();
      const user = await makeUser(t);

      const notifId = await t.run(async (ctx: any) => {
        return ctx.db.insert("user_notifications", {
          userId: user.userId, title: "Test", body: "Body",
          type: "general", isRead: false, createdAt: Date.now(),
        });
      });

      await t.mutation(api.users.deleteAccount, {
        accessToken: user.accessToken, confirmText: "DELETE",
      });

      const notif = await t.run(async (ctx: any) => ctx.db.get(notifId));
      expect(notif).toBeNull();
    } finally { vi.unstubAllEnvs(); }
  });

  it("creates an audit log entry", async () => {
    const t = convexTest(schema);
    try {
      stubEnv();
      const user = await makeUser(t);

      await t.mutation(api.users.deleteAccount, {
        accessToken: user.accessToken, confirmText: "DELETE",
      });

      // Check audit log
      const auditLog = await t.run(async (ctx: any) => {
        return ctx.db.query("audit_logs")
          .withIndex("by_action", (q: any) => q.eq("action", "account_deleted"))
          .first();
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog.actorId).toBe(user.userId);
      expect(auditLog.targetType).toBe("user");
    } finally { vi.unstubAllEnvs(); }
  });

  it("deletes reviews and rolls back book rating", async () => {
    const t = convexTest(schema);
    try {
      stubEnv();
      const user = await makeUser(t);

      const bookId = await t.run(async (ctx: any) => {
        return ctx.db.insert("books", {
          title: "B", author: "A", description: "D", rentPerDay: 5,
          genre: "Fiction", genres: ["Fiction"], totalCopies: 1,
          availableCopies: 1, rating: 4, ratingCount: 1, avgRating: 4,
          totalReviews: 1, rating4Count: 1, createdAt: Date.now(),
        });
      });

      const rentalId = await t.run(async (ctx: any) => {
        return ctx.db.insert("rentals", {
          userId: user.userId, bookId, zone: "College",
          deliveryLocation: { phone: "9876543210", roomNo: "B", rollNo: "R" },
          rentPerDay: 5, totalRent: 15, status: "returned",
          createdAt: Date.now(),
        });
      });

      const reviewId = await t.run(async (ctx: any) => {
        return ctx.db.insert("reviews", {
          bookId, userId: user.userId, rentalId,
          rating: 4, createdAt: Date.now(),
        });
      });

      await t.mutation(api.users.deleteAccount, {
        accessToken: user.accessToken, confirmText: "DELETE",
      });

      // Review should be deleted
      const review = await t.run(async (ctx: any) => ctx.db.get(reviewId));
      expect(review).toBeNull();

      // Book rating should be reset (was the only review)
      const book = await t.run(async (ctx: any) => ctx.db.get(bookId));
      expect(book.rating).toBe(0);
      expect(book.ratingCount).toBe(0);
    } finally { vi.unstubAllEnvs(); }
  });
});
