/**
 * Authentication flow tests using convex-test.
 *
 * Covers: signup OTP, OTP verification, sign-in, session management,
 * password change, sign-out, and Google sign-in guard.
 */
import { convexTest } from "convex-test";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

// ─── Env & Timer Setup ──────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv("USE_DEV_OTP", "true");
  vi.stubEnv("JWT_ACCESS_SECRET", "test-access-secret-long-enough-for-hmac");
  vi.stubEnv("JWT_REFRESH_SECRET", "test-refresh-secret-long-enough-for-hmac");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createUserViaOTP(t: any, email: string, password: string, phone = "9876543210") {
  await t.mutation(api.auth.sendSignupOTP, {
    name: "Test User", email, phone, password, acceptedTerms: true,
  });
  await t.finishAllScheduledFunctions(vi.runAllTimers);

  const result = await t.mutation(api.auth.verifySignupOTP, {
    email, otpCode: "123456",
  });
  await t.finishAllScheduledFunctions(vi.runAllTimers);
  return result;
}

// ─── Signup OTP Flow ─────────────────────────────────────────────────────────

describe("sendSignupOTP", () => {
  it("sends OTP for valid signup data", async () => {
    const t = convexTest(schema);
    const result = await t.mutation(api.auth.sendSignupOTP, {
      name: "New User", email: "new@example.com", phone: "9876543210",
      password: "securepassword123", acceptedTerms: true,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(result.status).toBe("otp_sent");
    expect(result.email).toBe("new@example.com");
  });

  it("rejects empty name", async () => {
    const t = convexTest(schema);
    await expect(t.mutation(api.auth.sendSignupOTP, {
      name: "", email: "t@e.com", phone: "9876543210",
      password: "securepassword", acceptedTerms: true,
    })).rejects.toThrow("Name is required");
  });

  it("rejects invalid email format", async () => {
    const t = convexTest(schema);
    await expect(t.mutation(api.auth.sendSignupOTP, {
      name: "User", email: "not-an-email", phone: "9876543210",
      password: "securepassword", acceptedTerms: true,
    })).rejects.toThrow("Invalid email");
  });

  it("rejects short password", async () => {
    const t = convexTest(schema);
    await expect(t.mutation(api.auth.sendSignupOTP, {
      name: "User", email: "t@e.com", phone: "9876543210",
      password: "short", acceptedTerms: true,
    })).rejects.toThrow("at least 8 characters");
  });

  it("rejects if terms not accepted", async () => {
    const t = convexTest(schema);
    await expect(t.mutation(api.auth.sendSignupOTP, {
      name: "User", email: "t@e.com", phone: "9876543210",
      password: "securepassword", acceptedTerms: false,
    })).rejects.toThrow("Privacy Policy");
  });

  it("rejects invalid phone format", async () => {
    const t = convexTest(schema);
    await expect(t.mutation(api.auth.sendSignupOTP, {
      name: "User", email: "t@e.com", phone: "123",
      password: "securepassword", acceptedTerms: true,
    })).rejects.toThrow("10 and 15 digits");
  });

  it("rejects duplicate email", async () => {
    const t = convexTest(schema);
    // Create existing user
    await t.run(async (ctx: any) => {
      await ctx.db.insert("users", {
        name: "Existing", email: "dup@example.com", phone: "1111111111",
        passwordHash: "pbkdf2$aa$bb", providers: ["local"],
        lastLoginProvider: "local", role: "user",
        acceptedTerms: true, acceptedAt: Date.now(), createdAt: Date.now(),
      });
    });
    await expect(t.mutation(api.auth.sendSignupOTP, {
      name: "New", email: "dup@example.com", phone: "2222222222",
      password: "securepassword", acceptedTerms: true,
    })).rejects.toThrow("already registered");
  });
});

// ─── Verify Signup OTP ───────────────────────────────────────────────────────

describe("verifySignupOTP", () => {
  it("creates user and session on valid OTP", async () => {
    const t = convexTest(schema);
    const result = await createUserViaOTP(t, "otp@example.com", "securepassword123", "5555555555");
    expect(result.userId).toBeDefined();
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it("rejects wrong OTP code", async () => {
    const t = convexTest(schema);
    await t.mutation(api.auth.sendSignupOTP, {
      name: "User", email: "otp2@example.com", phone: "4444444444",
      password: "securepassword123", acceptedTerms: true,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    await expect(t.mutation(api.auth.verifySignupOTP, {
      email: "otp2@example.com", otpCode: "999999",
    })).rejects.toThrow("Invalid verification code");
  });

  it("rejects when no OTP request exists", async () => {
    const t = convexTest(schema);
    await expect(t.mutation(api.auth.verifySignupOTP, {
      email: "nonexistent@example.com", otpCode: "123456",
    })).rejects.toThrow("No active signup session");
  });
});

// ─── Sign In ─────────────────────────────────────────────────────────────────

describe("signIn", () => {
  it("authenticates valid credentials", async () => {
    const t = convexTest(schema);
    await createUserViaOTP(t, "signin@example.com", "mypassword123", "7777777777");

    const result = await t.mutation(api.auth.signIn, {
      email: "signin@example.com", password: "mypassword123",
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(result.userId).toBeDefined();
    expect(result.role).toBe("user");
    expect(result.accessToken).toBeDefined();
  });

  it("rejects wrong password", async () => {
    const t = convexTest(schema);
    await createUserViaOTP(t, "wrongpw@example.com", "correctpassword", "6666666666");

    await expect(t.mutation(api.auth.signIn, {
      email: "wrongpw@example.com", password: "wrongpassword",
    })).rejects.toThrow("Invalid email or password");
  });

  it("rejects nonexistent email", async () => {
    const t = convexTest(schema);
    await expect(t.mutation(api.auth.signIn, {
      email: "ghost@example.com", password: "anypassword",
    })).rejects.toThrow("Invalid email or password");
  });

  it("blocks Google-only accounts from password login", async () => {
    const t = convexTest(schema);
    await t.run(async (ctx: any) => {
      await ctx.db.insert("users", {
        name: "Google User", email: "google@example.com",
        providers: ["google"], lastLoginProvider: "google",
        role: "user", createdAt: Date.now(),
      });
    });
    await expect(t.mutation(api.auth.signIn, {
      email: "google@example.com", password: "anypassword",
    })).rejects.toThrow("social login");
  });
});

// ─── Session Management ──────────────────────────────────────────────────────

describe("getSession", () => {
  it("returns user data for valid access token", async () => {
    const t = convexTest(schema);
    const signup = await createUserViaOTP(t, "session@example.com", "securepassword", "3333333333");

    const session = await t.query(api.auth.getSession, {
      accessToken: signup.accessToken,
    });
    expect(session).not.toBeNull();
    expect(session!.email).toBe("session@example.com");
    expect(session!.role).toBe("user");
  });

  it("returns null for invalid access token", async () => {
    const t = convexTest(schema);
    const session = await t.query(api.auth.getSession, {
      accessToken: "invalid-token",
    });
    expect(session).toBeNull();
  });
});

describe("refreshSession", () => {
  it("rotates tokens and invalidates old refresh token", async () => {
    const t = convexTest(schema);
    const signup = await createUserViaOTP(t, "refresh@example.com", "securepassword", "2222222222");

    const refreshed = await t.mutation(api.auth.refreshSession, {
      refreshToken: signup.refreshToken,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(refreshed.accessToken).toBeDefined();
    expect(refreshed.accessToken).not.toBe(signup.accessToken);

    // Old refresh token should now be rejected
    await expect(t.mutation(api.auth.refreshSession, {
      refreshToken: signup.refreshToken,
    })).rejects.toThrow();
  });
});

// ─── Sign Out ────────────────────────────────────────────────────────────────

describe("signOut", () => {
  it("revokes the session", async () => {
    const t = convexTest(schema);
    const signup = await createUserViaOTP(t, "signout@example.com", "securepassword", "1111111111");

    await t.mutation(api.auth.signOut, { refreshToken: signup.refreshToken });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    await expect(t.mutation(api.auth.refreshSession, {
      refreshToken: signup.refreshToken,
    })).rejects.toThrow();
  });
});

// ─── Password Change ─────────────────────────────────────────────────────────

describe("changePassword", () => {
  it("changes password and revokes sessions", async () => {
    const t = convexTest(schema);
    const signup = await createUserViaOTP(t, "pwchange@example.com", "oldpassword123", "8888888888");

    await t.mutation(api.auth.changePassword, {
      accessToken: signup.accessToken,
      currentPassword: "oldpassword123",
      newPassword: "newpassword456",
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    // Old access token should be rejected (session revoked)
    const session = await t.query(api.auth.getSession, {
      accessToken: signup.accessToken,
    });
    expect(session).toBeNull();
  });

  it("rejects short new password", async () => {
    const t = convexTest(schema);
    const signup = await createUserViaOTP(t, "shortpw@example.com", "oldpassword123", "0000000000");

    await expect(t.mutation(api.auth.changePassword, {
      accessToken: signup.accessToken,
      currentPassword: "oldpassword123",
      newPassword: "short",
    })).rejects.toThrow("at least 8 characters");
  });
});
