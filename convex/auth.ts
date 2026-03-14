import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { recordUserRegistered } from "./analytics";
import { createToken, sha256, verifyToken } from "./lib/jwt";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET environment variable is not set.");
    }
    return secret;
}

/** Access token expiry in milliseconds (default: 30 minutes). */
function getAccessTokenExpiryMs(): number {
    const minutes = parseInt(
        process.env.ACCESS_TOKEN_EXPIRY_MINUTES ?? "30",
        10
    );
    return minutes * 60 * 1000;
}

/** Refresh token expiry in milliseconds (default: 10 days). */
function getRefreshTokenExpiryMs(): number {
    const days = parseInt(
        process.env.REFRESH_TOKEN_EXPIRY_DAYS ?? "10",
        10
    );
    return days * 24 * 60 * 60 * 1000;
}

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "");
}

/**
 * Generate an access + refresh token pair and persist the refresh token.
 */
async function createSessionTokens(
    ctx: { db: any },
    userId: Id<"users">
) {
    const secret = getJwtSecret();
    const accessExpiryMs = getAccessTokenExpiryMs();
    const refreshExpiryMs = getRefreshTokenExpiryMs();

    const accessToken = await createToken(
        { sub: userId, type: "access" },
        secret,
        accessExpiryMs
    );

    const refreshToken = await createToken(
        { sub: userId, type: "refresh" },
        secret,
        refreshExpiryMs
    );

    // Store a hash of the refresh token in the DB (never the raw token)
    const tokenHash = await sha256(refreshToken);
    await ctx.db.insert("sessions", {
        userId,
        tokenHash,
        expiresAt: Date.now() + refreshExpiryMs,
        createdAt: Date.now(),
    });

    return { accessToken, refreshToken };
}

// ─── Sign Up ─────────────────────────────────────────────────────────────────

export const signUp = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        phone: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        if (!args.name.trim()) throw new Error("Name is required.");
        if (!args.email.trim()) throw new Error("Email is required.");
        if (!args.phone.trim()) throw new Error("Phone number is required.");
        if (args.password.length < 6)
            throw new Error("Password must be at least 6 characters.");

        const normalizedEmail = args.email.toLowerCase().trim();
        const normalizedPhone = normalizePhone(args.phone.trim());

        if (normalizedPhone.length < 10) {
            throw new Error("Please enter a valid phone number.");
        }

        // Check if email already exists
        const existingEmail = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .first();

        if (existingEmail) {
            throw new Error("User is already registered. Please sign in.");
        }

        // Check if phone number already exists
        const existingPhone = await ctx.db
            .query("users")
            .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
            .first();

        if (existingPhone) {
            throw new Error("User is already registered. Please sign in.");
        }

        const passwordHash = await hashPassword(args.password);

        const userId = await ctx.db.insert("users", {
            name: args.name.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            passwordHash,
            role: "user",
            createdAt: Date.now(),
        });

        await recordUserRegistered(ctx, userId, Date.now());

        const tokens = await createSessionTokens(ctx, userId);
        return { userId, ...tokens };
    },
});

// ─── Sign In ─────────────────────────────────────────────────────────────────

export const signIn = mutation({
    args: {
        email: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        if (!args.email.trim()) throw new Error("Email is required.");
        if (!args.password) throw new Error("Password is required.");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) =>
                q.eq("email", args.email.toLowerCase().trim())
            )
            .first();

        if (!user) {
            throw new Error("Invalid email or password.");
        }

        const passwordHash = await hashPassword(args.password);
        if (user.passwordHash !== passwordHash) {
            throw new Error("Invalid email or password.");
        }

        const tokens = await createSessionTokens(ctx, user._id);
        return { userId: user._id, role: user.role, ...tokens };
    },
});

// ─── Get Session (verify access token) ───────────────────────────────────────

export const getSession = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        try {
            const secret = getJwtSecret();
            const payload = await verifyToken(args.accessToken, secret);

            if (payload.type !== "access") {
                return null;
            }

            const userId = payload.sub as Id<"users">;
            const user = await ctx.db.get(userId);
            if (!user) return null;

            return {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            };
        } catch {
            // Token expired or invalid
            return null;
        }
    },
});

// ─── Refresh Session ─────────────────────────────────────────────────────────

export const refreshSession = mutation({
    args: { refreshToken: v.string() },
    handler: async (ctx, args) => {
        const secret = getJwtSecret();

        // Verify the refresh token JWT
        let payload;
        try {
            payload = await verifyToken(args.refreshToken, secret);
        } catch {
            throw new Error("Invalid or expired refresh token. Please sign in again.");
        }

        if (payload.type !== "refresh") {
            throw new Error("Invalid token type.");
        }

        // Check the refresh token exists in DB
        const tokenHash = await sha256(args.refreshToken);
        const session = await ctx.db
            .query("sessions")
            .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
            .first();

        if (!session || session.expiresAt < Date.now()) {
            // Clean up expired session if it exists
            if (session) {
                await ctx.db.delete(session._id);
            }
            throw new Error("Session expired. Please sign in again.");
        }

        // Create a new access token
        const accessExpiryMs = getAccessTokenExpiryMs();
        const accessToken = await createToken(
            { sub: payload.sub, type: "access" },
            secret,
            accessExpiryMs
        );

        return { accessToken };
    },
});

// ─── Sign Out ────────────────────────────────────────────────────────────────

export const signOut = mutation({
    args: { refreshToken: v.string() },
    handler: async (ctx, args) => {
        try {
            const tokenHash = await sha256(args.refreshToken);
            const session = await ctx.db
                .query("sessions")
                .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
                .first();

            if (session) {
                await ctx.db.delete(session._id);
            }
        } catch {
            // Ignore errors during sign-out — always succeed client-side
        }
    },
});
