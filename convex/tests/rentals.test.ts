/**
 * Rental lifecycle tests using convex-test.
 */
import { convexTest } from "convex-test";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const ENV = {
  USE_DEV_OTP: "true",
  JWT_ACCESS_SECRET: "test-access-secret-long-enough-for-hmac",
  JWT_REFRESH_SECRET: "test-refresh-secret-long-enough-for-hmac",
};

beforeEach(() => {
  vi.useFakeTimers();
  for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

async function makeUser(t: any, overrides: Record<string, any> = {}) {
  const userId = await t.run(async (ctx: any) => {
    return ctx.db.insert("users", {
      name: "User", email: "u@test.com", phone: "9876543210",
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
  return { userId, accessToken };
}

async function makeAdmin(t: any) {
  return makeUser(t, { name: "Admin", email: "admin@test.com", phone: "1234567890", role: "admin" });
}

async function makeBook(t: any, overrides: Record<string, any> = {}) {
  return t.run(async (ctx: any) => {
    return ctx.db.insert("books", {
      title: "Book", author: "Author", description: "Desc",
      rentPerDay: 5, genre: "Fiction", genres: ["Fiction"],
      totalCopies: 3, availableCopies: 3, rating: 0, ratingCount: 0,
      createdAt: Date.now(), ...overrides,
    });
  });
}

describe("requestRental", () => {
  it("creates rental and decrements copies", async () => {
    const t = convexTest(schema);
    const user = await makeUser(t, { isVerifiedStudent: true });
    const bookId = await makeBook(t);
    const rentalId = await t.mutation(api.rentals.requestRental, {
      bookId, zone: "College",
      deliveryLocation: { phone: "9876543210", roomNo: "B-101", rollNo: "20B01A0512" },
      accessToken: user.accessToken,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(rentalId).toBeDefined();
    const book = await t.run(async (ctx: any) => ctx.db.get(bookId));
    expect(book.availableCopies).toBe(2);
  });

  it("rejects duplicate active rental", async () => {
    const t = convexTest(schema);
    const user = await makeUser(t, { isVerifiedStudent: true });
    const bookId = await makeBook(t);
    await t.mutation(api.rentals.requestRental, {
      bookId, zone: "College",
      deliveryLocation: { phone: "9876543210", roomNo: "B-101", rollNo: "20B01A0512" },
      accessToken: user.accessToken,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    await expect(t.mutation(api.rentals.requestRental, {
      bookId, zone: "College",
      deliveryLocation: { phone: "9876543210", roomNo: "B-101", rollNo: "20B01A0512" },
      accessToken: user.accessToken,
    })).rejects.toThrow("already have an active rental");
  });

  it("rejects unavailable book", async () => {
    const t = convexTest(schema);
    const user = await makeUser(t, { isVerifiedStudent: true });
    const bookId = await makeBook(t, { availableCopies: 0 });
    await expect(t.mutation(api.rentals.requestRental, {
      bookId, zone: "College",
      deliveryLocation: { phone: "9876543210", roomNo: "B-101", rollNo: "20B01A0512" },
      accessToken: user.accessToken,
    })).rejects.toThrow("currently unavailable");
  });

  it("rejects invalid phone", async () => {
    const t = convexTest(schema);
    const user = await makeUser(t, { isVerifiedStudent: true });
    const bookId = await makeBook(t);
    await expect(t.mutation(api.rentals.requestRental, {
      bookId, zone: "College",
      deliveryLocation: { phone: "123", roomNo: "B-101", rollNo: "20B01A0512" },
      accessToken: user.accessToken,
    })).rejects.toThrow("10-digit phone");
  });

  it("rejects invalid zone", async () => {
    const t = convexTest(schema);
    const user = await makeUser(t, { isVerifiedStudent: true });
    const bookId = await makeBook(t);
    await expect(t.mutation(api.rentals.requestRental, {
      bookId, zone: "InvalidZone",
      deliveryLocation: { phone: "9876543210" },
      accessToken: user.accessToken,
    })).rejects.toThrow("Invalid zone");
  });

  it("blocks unverified students from College Zone", async () => {
    const t = convexTest(schema);
    const user = await makeUser(t, { isVerifiedStudent: false });
    const bookId = await makeBook(t);
    await expect(t.mutation(api.rentals.requestRental, {
      bookId, zone: "College",
      deliveryLocation: { phone: "9876543210", roomNo: "B-101", rollNo: "20B01A0512" },
      accessToken: user.accessToken,
    })).rejects.toThrow("verified students");
  });

  it("requires roomNo for College delivery", async () => {
    const t = convexTest(schema);
    const user = await makeUser(t, { isVerifiedStudent: true });
    const bookId = await makeBook(t);
    await expect(t.mutation(api.rentals.requestRental, {
      bookId, zone: "College",
      deliveryLocation: { phone: "9876543210" },
      accessToken: user.accessToken,
    })).rejects.toThrow("Room number is required");
  });
});

describe("scheduleDelivery", () => {
  it("admin schedules delivery", async () => {
    const t = convexTest(schema);
    const user = await makeUser(t, { isVerifiedStudent: true });
    const admin = await makeAdmin(t);
    const bookId = await makeBook(t);
    const rentalId = await t.mutation(api.rentals.requestRental, {
      bookId, zone: "College",
      deliveryLocation: { phone: "9876543210", roomNo: "B-101", rollNo: "20B01A0512" },
      accessToken: user.accessToken,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    await t.mutation(api.rentals.scheduleDelivery, {
      rentalId, deliveryDate: tomorrow.toISOString().split("T")[0],
      deliveryTime: "Morning (9 AM - 12 PM)", accessToken: admin.accessToken,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const rental = await t.run(async (ctx: any) => ctx.db.get(rentalId));
    expect(rental.status).toBe("delivery_scheduled");
  });

  it("rejects invalid time slot", async () => {
    const t = convexTest(schema);
    const user = await makeUser(t, { isVerifiedStudent: true });
    const admin = await makeAdmin(t);
    const bookId = await makeBook(t);
    const rentalId = await t.mutation(api.rentals.requestRental, {
      bookId, zone: "College",
      deliveryLocation: { phone: "9876543210", roomNo: "B-101", rollNo: "20B01A0512" },
      accessToken: user.accessToken,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    await expect(t.mutation(api.rentals.scheduleDelivery, {
      rentalId, deliveryDate: tomorrow.toISOString().split("T")[0],
      deliveryTime: "Invalid Slot", accessToken: admin.accessToken,
    })).rejects.toThrow("Invalid delivery time slot");
  });
});

describe("markDelivered", () => {
  it("transitions to delivered", async () => {
    const t = convexTest(schema);
    const user = await makeUser(t, { isVerifiedStudent: true });
    const admin = await makeAdmin(t);
    const bookId = await makeBook(t);
    const rentalId = await t.mutation(api.rentals.requestRental, {
      bookId, zone: "College",
      deliveryLocation: { phone: "9876543210", roomNo: "B-101", rollNo: "20B01A0512" },
      accessToken: user.accessToken,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    await t.mutation(api.rentals.scheduleDelivery, {
      rentalId, deliveryDate: tomorrow.toISOString().split("T")[0],
      deliveryTime: "Morning (9 AM - 12 PM)", accessToken: admin.accessToken,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    await t.mutation(api.rentals.markDelivered, { rentalId, accessToken: admin.accessToken });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const rental = await t.run(async (ctx: any) => ctx.db.get(rentalId));
    expect(rental.status).toBe("delivered");
  });

  it("rejects wrong status", async () => {
    const t = convexTest(schema);
    const user = await makeUser(t, { isVerifiedStudent: true });
    const admin = await makeAdmin(t);
    const bookId = await makeBook(t);
    const rentalId = await t.mutation(api.rentals.requestRental, {
      bookId, zone: "College",
      deliveryLocation: { phone: "9876543210", roomNo: "B-101", rollNo: "20B01A0512" },
      accessToken: user.accessToken,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    await expect(t.mutation(api.rentals.markDelivered, {
      rentalId, accessToken: admin.accessToken,
    })).rejects.toThrow("'delivery_scheduled'");
  });
});

describe("markReturned", () => {
  it("rejects unpaid rental", async () => {
    const t = convexTest(schema);
    const user = await makeUser(t, { isVerifiedStudent: true });
    const admin = await makeAdmin(t);
    const bookId = await makeBook(t);
    const rentalId = await t.mutation(api.rentals.requestRental, {
      bookId, zone: "College",
      deliveryLocation: { phone: "9876543210", roomNo: "B-101", rollNo: "20B01A0512" },
      accessToken: user.accessToken,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    await expect(t.mutation(api.rentals.markReturned, {
      rentalId, accessToken: admin.accessToken,
    })).rejects.toThrow("Payment must be completed");
  });

  it("increments copies on return", async () => {
    const t = convexTest(schema);
    const admin = await makeAdmin(t);
    const user = await makeUser(t, { isVerifiedStudent: true });
    const bookId = await makeBook(t);
    const rentalId = await t.run(async (ctx: any) => {
      await ctx.db.patch(bookId, { availableCopies: 2 });
      return ctx.db.insert("rentals", {
        userId: user.userId, bookId, zone: "College",
        deliveryLocation: { phone: "9876543210", roomNo: "B-101", rollNo: "R1" },
        rentPerDay: 5, totalRent: 15, status: "paid", paymentStatus: "paid",
        paymentMethod: "cash", deliveryDate: "2026-05-10",
        deliveryTime: "Morning (9 AM - 12 PM)", pickupDate: "2026-05-13",
        pickupTime: "Morning (9 AM - 12 PM)", userRating: 4,
        ratedAt: Date.now(), createdAt: Date.now(),
      });
    });
    await t.mutation(api.rentals.markReturned, { rentalId, accessToken: admin.accessToken });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const rental = await t.run(async (ctx: any) => ctx.db.get(rentalId));
    expect(rental.status).toBe("returned");
    const book = await t.run(async (ctx: any) => ctx.db.get(bookId));
    expect(book.availableCopies).toBe(3);
  });
});
