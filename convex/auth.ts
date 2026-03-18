import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { recordUserRegistered } from "./analytics";
import {
    getAccessTokenSecret,
    getRefreshTokenSecret,
    getUserIdFromAccessToken,
    hashPassword,
    verifyPassword,
} from "./lib/authHelpers";
import { verifyGoogleIdToken } from "./lib/google";
import { createToken, sha256, verifyToken } from "./lib/jwt";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "");
}

function isSessionRevoked(
    session: { isRevoked?: boolean } | null | undefined
): boolean {
    return session?.isRevoked ?? false;
}

function getSessionRefreshTokenHash(
    session: { refreshTokenHash?: string; tokenHash?: string } | null | undefined
): string | undefined {
    return session?.refreshTokenHash ?? session?.tokenHash;
}

/**
 * Generate an access + refresh token pair and persist the refresh token.
 */
async function createSessionTokens(
    ctx: { db: any },
    userId: Id<"users">,
    deviceInfo?: string,
    ipAddress?: string
) {
    const accessSecret = getAccessTokenSecret();
    const refreshSecret = getRefreshTokenSecret();
    const accessExpiryMs = getAccessTokenExpiryMs();
    const refreshExpiryMs = getRefreshTokenExpiryMs();

    // 1. Create session record first to get the ID (sid)
    const sessionId = await ctx.db.insert("sessions", {
        userId,
        refreshTokenHash: "pending", // Placeholder
        deviceInfo,
        ipAddress,
        isRevoked: false,
        expiresAt: Date.now() + refreshExpiryMs,
        createdAt: Date.now(),
    });

    // 2. Generate tokens with the sid — each signed with its own secret
    const accessToken = await createToken(
        { sub: userId, sid: sessionId, type: "access" },
        accessSecret,
        accessExpiryMs
    );

    const refreshToken = await createToken(
        { sub: userId, sid: sessionId, type: "refresh" },
        refreshSecret,
        refreshExpiryMs
    );

    // 3. Update the session with the actual refresh token hash
    const refreshTokenHash = await sha256(refreshToken);
    await ctx.db.patch(sessionId, { refreshTokenHash });

    return { accessToken, refreshToken, sessionId };
}

// ─── Sign Up ─────────────────────────────────────────────────────────────────

export const signUp = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        phone: v.string(),
        password: v.string(),
        deviceInfo: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
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
            providers: ["local"],
            lastLoginProvider: "local",
            role: "user",
            createdAt: Date.now(),
        });

        await recordUserRegistered(ctx, userId, Date.now());

        const { accessToken, refreshToken } = await createSessionTokens(ctx, userId, args.deviceInfo, args.ipAddress);
        return { userId, accessToken, refreshToken };
    },
});

// ─── Sign In ─────────────────────────────────────────────────────────────────

export const signIn = mutation({
    args: {
        email: v.string(),
        password: v.string(),
        deviceInfo: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
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

        if (!user.passwordHash) {
            throw new Error("This account uses social login. Please sign in with Google.");
        }

        const isValid = await verifyPassword(args.password, user.passwordHash);
        if (!isValid) {
            throw new Error("Invalid email or password.");
        }

        // Auto-upgrade: Re-hash the password with PBKDF2 if it's a legacy SHA-256 hash
        if (!user.passwordHash.startsWith("pbkdf2$")) {
            const upgradedHash = await hashPassword(args.password);
            await ctx.db.patch(user._id, { passwordHash: upgradedHash });
        }

        const { accessToken, refreshToken } = await createSessionTokens(ctx, user._id, args.deviceInfo, args.ipAddress);
        await ctx.db.patch(user._id, { lastLoginProvider: "local" });
        return { userId: user._id, role: user.role, accessToken, refreshToken };
    },
});

// ─── Google Sign In (Rate Limiting) ──────────────────────────────────────────

const LOGIN_ATTEMPTS = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 60 * 1000; // 1 minute

function checkRateLimit(email: string) {
    const now = Date.now();
    const stats = LOGIN_ATTEMPTS.get(email);

    if (stats) {
        if (now - stats.lastAttempt < COOLDOWN_MS) {
            if (stats.count >= MAX_ATTEMPTS) {
                console.warn("[Auth] Rate limit exceeded", { email });
                throw new Error("Too many login attempts. Please try again later.");
            }
            stats.count += 1;
        } else {
            stats.count = 1;
        }
        stats.lastAttempt = now;
    } else {
        LOGIN_ATTEMPTS.set(email, { count: 1, lastAttempt: now });
    }
}

export const googleSignIn = mutation({
    args: {
        idToken: v.string(),
        deviceInfo: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            throw new Error("GOOGLE_CLIENT_ID environment variable is not set.");
        }

        // 1. Verify Google ID token (Normalizes email & name internally)
        const payload = await verifyGoogleIdToken(args.idToken, clientId);
        const normalizedEmail = payload.email; // Already lowercased and trimmed by verifyGoogleIdToken

        // 2. Lightweight Rate Limiting
        checkRateLimit(normalizedEmail);

        // 3. Find existing user by email
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .first();

        let userId: Id<"users">;

        if (existingUser) {
            userId = existingUser._id;
            const updates: any = { lastLoginProvider: "google" };

            // 4. Link account if "google" provider is missing (Ensure uniqueness)
            const providers = existingUser.providers ?? ["local"];
            if (!providers.includes("google")) {
                updates.providers = [...new Set([...providers, "google"])];
            }

            // 5. Update avatar only if missing
            if (!existingUser.avatarUrl && payload.picture) {
                updates.avatarUrl = payload.picture;
            }

            await ctx.db.patch(userId, updates);
        } else {
            // 6. Create new user for Google login
            userId = await ctx.db.insert("users", {
                name: payload.name,
                email: normalizedEmail,
                providers: ["google"],
                lastLoginProvider: "google",
                role: "user",
                avatarUrl: payload.picture,
                createdAt: Date.now(),
            });
            await recordUserRegistered(ctx, userId, Date.now());
        }

        // 7. Issue custom JWT session tokens
        const { accessToken, refreshToken } = await createSessionTokens(ctx, userId, args.deviceInfo, args.ipAddress);
        const user = (await ctx.db.get(userId))!;

        return { userId, role: user.role, accessToken, refreshToken };
    },
});

// ─── Get Session (verify access token) ───────────────────────────────────────

export const getSession = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        try {
            const secret = getAccessTokenSecret();
            const payload = await verifyToken(args.accessToken, secret);

            if (payload.type !== "access") {
                return null;
            }

            const sid = payload.sid as Id<"sessions">;
            const session = await ctx.db.get(sid);
            if (!session || isSessionRevoked(session) || session.expiresAt < Date.now()) {
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
                avatarUrl: user.avatarUrl,
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
        const secret = getRefreshTokenSecret();

        // 1. Verify the refresh token JWT
        let payload;
        try {
            payload = await verifyToken(args.refreshToken, secret);
        } catch (err: any) {
            console.warn("[Auth] Refresh token JWT verification failed", { reason: err.message });
            throw new Error("Session expired. Please sign in again.");
        }

        if (payload.type !== "refresh") {
            throw new Error("Invalid token type.");
        }

        const sid = payload.sid as Id<"sessions">;
        const session = await ctx.db.get(sid);

        if (!session) {
            console.warn("[Auth] Session not found for sID", { sid });
            throw new Error("Session invalid. Please sign in again.");
        }

        // 2. Refresh Token Hash Verification (Ensures the raw token matches)
        const incomingHash = await sha256(args.refreshToken);
        const storedHash = getSessionRefreshTokenHash(session);
        if (!storedHash || storedHash !== incomingHash) {
            // If sid matches but hash doesn't, this is highly suspicious
            console.error("[Auth] Security Alert: Sid-Hash mismatch for session", { sid });
            throw new Error("Invalid session data.");
        }

        const userId = payload.sub as Id<"users">;

        // 3. Attack Detection: If session is already revoked, it's a replay attack!
        if (isSessionRevoked(session)) {
            console.error("[Auth] Security Alert: Refresh token reuse detected! Full account lockout triggered.", { userId, sid });

            // Revoke ALL active sessions for this user (Lockdown)
            const activeSessions = await ctx.db
                .query("sessions")
                .withIndex("by_userId_active", (q) => q.eq("userId", userId).eq("isRevoked", false))
                .collect();

            for (const s of activeSessions) {
                await ctx.db.patch(s._id, { isRevoked: true });
            }

            throw new Error("SESSION_COMPROMISED");
        }

        if (session.expiresAt < Date.now()) {
            await ctx.db.patch(sid, { isRevoked: true });
            throw new Error("Session expired. Please sign in again.");
        }

        // 4. Strict Rotation Chain: Issue new session linked to the old one
        const { accessToken, refreshToken, sessionId: newSid } = await createSessionTokens(
            ctx,
            userId,
            session.deviceInfo,
            session.ipAddress
        );

        // Mark current session as revoked AND store the link
        await ctx.db.patch(sid, {
            isRevoked: true,
            replacedBySessionId: newSid,
        });

        return { accessToken, refreshToken };
    },
});

// ─── Session Management ───────────────────────────────────────────────────────

export const getUserSessions = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        let userId: Id<"users">;
        try {
            userId = await getUserIdFromAccessToken(args.accessToken);
        } catch {
            return [];
        }

        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_userId_active", (q) => q.eq("userId", userId).eq("isRevoked", false))
            .order("desc")
            .collect();

        // Return non-sensitive data
        return sessions.map((s: any) => ({
            _id: s._id,
            deviceInfo: s.deviceInfo || "Unknown Device",
            ipAddress: s.ipAddress,
            isActive: s.expiresAt > Date.now(),
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
        }));
    },
});

export const revokeSession = mutation({
    args: {
        accessToken: v.string(),
        sessionId: v.id("sessions")
    },
    handler: async (ctx, args) => {
        let userId: Id<"users">;
        try {
            userId = await getUserIdFromAccessToken(args.accessToken);
        } catch {
            throw new Error("Unauthenticated");
        }

        const session = await ctx.db.get(args.sessionId);
        if (!session || session.userId !== userId) {
            throw new Error("Session not found or unauthorized");
        }

        await ctx.db.patch(session._id, { isRevoked: true });
        return true;
    },
});

export const revokeAllSessions = mutation({
    args: {
        accessToken: v.string(),
        exceptCurrent: v.optional(v.boolean())
    },
    handler: async (ctx, args) => {
        const secret = getAccessTokenSecret();
        const payload = await verifyToken(args.accessToken, secret);
        const userId = payload.sub as Id<"users">;
        const currentSid = payload.sid as string;

        const activeSessions = await ctx.db
            .query("sessions")
            .withIndex("by_userId_active", (q) => q.eq("userId", userId).eq("isRevoked", false))
            .collect();

        for (const s of activeSessions) {
            // If exceptCurrent is true, skip the session associated with this token
            if (args.exceptCurrent && s._id === currentSid) {
                continue;
            }
            await ctx.db.patch(s._id, { isRevoked: true });
        }
        return true;
    },
});

// ─── Sign Out ────────────────────────────────────────────────────────────────

export const signOut = mutation({
    args: { refreshToken: v.string() },
    handler: async (ctx, args) => {
        try {
            const secret = getRefreshTokenSecret();
            const payload = await verifyToken(args.refreshToken, secret);
            const sid = payload.sid as Id<"sessions">;

            // Revoking by SID is primary
            await ctx.db.patch(sid, { isRevoked: true });
        } catch {
            // Fallback: If token is invalid/expired, try revoking by hash
            try {
                const refreshTokenHash = await sha256(args.refreshToken);
                const session = await ctx.db
                    .query("sessions")
                    .withIndex("by_refreshTokenHash", (q) => q.eq("refreshTokenHash", refreshTokenHash))
                    .first();

                if (session) {
                    await ctx.db.patch(session._id, { isRevoked: true });
                    return;
                }

                const legacySessions = await ctx.db.query("sessions").collect();

                const matchingSession = legacySessions.find(
                    (current) => getSessionRefreshTokenHash(current) === refreshTokenHash
                );

                if (matchingSession) {
                    await ctx.db.patch(matchingSession._id, {
                        isRevoked: true,
                        refreshTokenHash,
                    });
                }
            } catch {
                // Ignore all errors during sign-out
            }
        }
    },
});

export const backfillLegacySessions = mutation({
    args: {},
    handler: async (ctx) => {
        const sessions = await ctx.db.query("sessions").collect();
        let updated = 0;

        for (const session of sessions) {
            const refreshTokenHash = getSessionRefreshTokenHash(session);
            const isRevoked = isSessionRevoked(session);

            if (
                session.refreshTokenHash === refreshTokenHash &&
                session.isRevoked === isRevoked
            ) {
                continue;
            }

            await ctx.db.patch(session._id, {
                refreshTokenHash,
                isRevoked,
            });
            updated += 1;
        }

        return { scanned: sessions.length, updated };
    },
});

export const backfillUsers = mutation({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        let updated = 0;

        for (const user of users) {
            if (user.providers && user.providers.length > 0) {
                continue;
            }

            // Assume local if providers is missing (migration from legacy system)
            await ctx.db.patch(user._id, {
                providers: ["local"],
            });
            updated += 1;
        }

        return { scanned: users.length, updated };
    },
});

export const changePassword = mutation({
    args: {
        accessToken: v.string(),
        currentPassword: v.string(),
        newPassword: v.string(),
    },
    handler: async (ctx, args) => {
        let userId: Id<"users">;
        try {
            userId = await getUserIdFromAccessToken(args.accessToken);
        } catch {
            throw new Error("Unauthenticated");
        }

        if (!args.currentPassword) {
            throw new Error("Current password is required.");
        }

        if (args.newPassword.length < 6) {
            throw new Error("New password must be at least 6 characters.");
        }

        const user = await ctx.db.get(userId);
        if (!user) {
            throw new Error("User not found.");
        }

        if (!user.passwordHash) {
            throw new Error("This account uses social login. Please change password via your Google account.");
        }

        const isCurrentValid = await verifyPassword(args.currentPassword, user.passwordHash);
        if (!isCurrentValid) {
            throw new Error("Current password is incorrect.");
        }

        const newPasswordHash = await hashPassword(args.newPassword);
        if (newPasswordHash === user.passwordHash) {
            throw new Error("New password must be different from the current password.");
        }

        await ctx.db.patch(userId, {
            passwordHash: newPasswordHash,
        });

        return true;
    },
});
