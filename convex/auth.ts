import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { recordUserRegistered } from "./analytics";
import {
    assertAdmin,
    getAccessTokenSecret,
    getRefreshTokenSecret,
    getUserIdFromAccessToken,
    hashPassword,
    verifyPassword,
} from "./lib/authHelpers";
import { verifyGoogleIdToken } from "./lib/google";
import { createToken, sha256, verifyToken } from "./lib/jwt";
import { assertRateLimit, buildRateLimitKey, clearRateLimit } from "./lib/rateLimit";

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

const AUTH_RATE_LIMITS = {
    signUp: {
        limit: 5,
        windowMs: 30 * 60 * 1000,
        message: "Too many sign-up attempts. Please try again later.",
    },
    signIn: {
        limit: 5,
        windowMs: 10 * 60 * 1000,
        message: "Too many sign-in attempts. Please try again later.",
    },
    googleSignIn: {
        limit: 8,
        windowMs: 10 * 60 * 1000,
        message: "Too many Google sign-in attempts. Please try again later.",
    },
    changePassword: {
        limit: 5,
        windowMs: 15 * 60 * 1000,
        message: "Too many password change attempts. Please try again later.",
    },
    global: {
        limit: 20,
        windowMs: 30 * 60 * 1000,
        message: "Too many authentication requests from this IP. Please try again later.",
    },
} as const;

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

export const sendSignupOTP = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        phone: v.string(),
        password: v.string(),
        acceptedTerms: v.boolean(),
        deviceInfo: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Strict Regex Validation
        if (!args.name.trim()) throw new Error("Name is required.");
        if (!/^[a-zA-Z\s\-']{2,100}$/.test(args.name.trim())) {
            throw new Error("Name can only contain letters, spaces, hyphens, and apostrophes (2-100 characters).");
        }

        if (!args.email.trim()) throw new Error("Email is required.");
        const normalizedEmail = args.email.toLowerCase().trim();
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/;
        if (!emailRegex.test(normalizedEmail)) throw new Error("Invalid email address format.");

        if (!args.phone.trim()) throw new Error("Phone number is required.");
        const normalizedPhone = normalizePhone(args.phone.trim());
        if (!/^\d{10,15}$/.test(normalizedPhone)) {
            throw new Error("Phone number must contain between 10 and 15 digits.");
        }

        if (!args.acceptedTerms) throw new Error("You must accept the Privacy Policy and Terms of Service.");
        if (args.password.length < 8)
            throw new Error("Password must be at least 8 characters.");
        if (args.password.length > 128)
            throw new Error("Password is too long (max 128 characters).");

        // IP Rate Limit Check
        if (args.ipAddress) {
            const globalKey = buildRateLimitKey("auth", "global", args.ipAddress);
            await assertRateLimit(ctx, globalKey, AUTH_RATE_LIMITS.global);
        }

        const otpRequestKey = buildRateLimitKey("auth", "otpRequest", normalizedEmail, args.ipAddress);
        await assertRateLimit(ctx, otpRequestKey, { limit: 3, windowMs: 15 * 60 * 1000, message: "Too many OTP requests. Please wait." });

        // Ensure user does not already exist
        const existingEmail = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .first();
        if (existingEmail) throw new Error("User is already registered. Please sign in.");

        const existingPhone = await ctx.db
            .query("users")
            .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
            .first();
        if (existingPhone) throw new Error("User is already registered. Please sign in.");

        // Clear any previous unverified OTP requests for this email to prevent abuse
        const previousRequests = await ctx.db
            .query("otp_requests")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .collect();

        for (const req of previousRequests) {
            await ctx.db.delete(req._id);
        }

        // Generate 6 Digit OTP securely
        // L4: Use cryptographically secure random for OTP generation
        const isDevMode = process.env.USE_DEV_OTP === "true";
        const otpArray = crypto.getRandomValues(new Uint32Array(1));
        const otpString = isDevMode ? "123456" : (100000 + (otpArray[0] % 900000)).toString();
        const otpCodeHash = await sha256(otpString);

        // Store request in db
        await ctx.db.insert("otp_requests", {
            email: normalizedEmail,
            otpCodeHash,
            signupData: JSON.stringify({
                name: args.name.trim(),
                phone: normalizedPhone,
                password: args.password,
                deviceInfo: args.deviceInfo,
                ipAddress: args.ipAddress,
            }),
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
            isVerified: false,
            createdAt: Date.now(),
        });

        // Skip email in dev mode
        if (!isDevMode) {
            await ctx.scheduler.runAfter(0, internal.email.sendOTP, {
                email: normalizedEmail,
                otpProvider: "resend",
                otpString,
            });
        } else {
            console.log(`[DEV OTP] Signup code for ${normalizedEmail}: ${otpString}`);
        }

        return { status: "otp_sent", email: normalizedEmail };
    },
});

export const verifySignupOTP = mutation({
    args: {
        email: v.string(),
        otpCode: v.string(),
    },
    handler: async (ctx, args) => {
        const normalizedEmail = args.email.toLowerCase().trim();

        const verifyOtpKey = buildRateLimitKey("auth", "verifyOtp", normalizedEmail);
        await assertRateLimit(ctx, verifyOtpKey, { limit: 10, windowMs: 15 * 60 * 1000, message: "Too many verification attempts." });

        const request = await ctx.db
            .query("otp_requests")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .first();

        if (!request) {
            throw new Error("No active signup session found. Please try registering again.");
        }

        if (request.expiresAt < Date.now()) {
            await ctx.db.delete(request._id);
            throw new Error("Verification code has expired. Please sign up again.");
        }

        // M3: Timing-safe OTP hash comparison
        const incomingOtpHash = await sha256(args.otpCode);
        const storedOtpHash = request.otpCodeHash;
        if (incomingOtpHash.length !== storedOtpHash.length) {
            throw new Error("Invalid verification code.");
        }
        let otpDiff = 0;
        for (let i = 0; i < incomingOtpHash.length; i++) {
            otpDiff |= incomingOtpHash.charCodeAt(i) ^ storedOtpHash.charCodeAt(i);
        }
        if (otpDiff !== 0) {
            throw new Error("Invalid verification code.");
        }

        // Complete the signup process
        if (!request.signupData) throw new Error("Registration data lost.");
        const signupData = JSON.parse(request.signupData);

        const passwordHash = await hashPassword(signupData.password);

        const userId = await ctx.db.insert("users", {
            name: signupData.name,
            email: normalizedEmail,
            phone: signupData.phone,
            passwordHash,
            providers: ["local"],
            lastLoginProvider: "local",
            role: "user",
            acceptedTerms: true,
            acceptedAt: Date.now(),
            createdAt: Date.now(),
        });

        await recordUserRegistered(ctx, userId, Date.now());

        const { accessToken, refreshToken } = await createSessionTokens(ctx, userId, signupData.deviceInfo, signupData.ipAddress);

        // Clean up OTP request explicitly after success
        await ctx.db.delete(request._id);
        await clearRateLimit(ctx, verifyOtpKey);

        return { userId, accessToken, refreshToken };
    },
});

// ─── Forgot Password ────────────────────────────────────────────────────────

export const sendPasswordResetOTP = mutation({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        if (!args.email.trim()) throw new Error("Email is required.");
        const normalizedEmail = args.email.toLowerCase().trim();

        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/;
        if (!emailRegex.test(normalizedEmail)) throw new Error("Invalid email address format.");

        const otpRequestKey = buildRateLimitKey("auth", "passwordReset", normalizedEmail);
        await assertRateLimit(ctx, otpRequestKey, { limit: 3, windowMs: 15 * 60 * 1000, message: "Too many reset requests. Please wait." });

        // Check if the user exists
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .first();

        if (!user) {
            // Don't reveal whether the email exists — silently succeed
            return { status: "otp_sent", email: normalizedEmail };
        }

        // L5: Don't reveal that the account is Google-only — silently succeed
        if (!user.passwordHash) {
            return { status: "otp_sent", email: normalizedEmail };
        }

        // Clear old reset OTPs for this email
        const previousRequests = await ctx.db
            .query("otp_requests")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .collect();
        for (const req of previousRequests) {
            await ctx.db.delete(req._id);
        }

        const isDevMode = process.env.USE_DEV_OTP === "true";
        const otpString = isDevMode ? "123456" : Math.floor(100000 + Math.random() * 900000).toString();
        const otpCodeHash = await sha256(otpString);

        await ctx.db.insert("otp_requests", {
            email: normalizedEmail,
            otpCodeHash,
            expiresAt: Date.now() + 10 * 60 * 1000,
            isVerified: false,
            createdAt: Date.now(),
        });

        if (!isDevMode) {
            await ctx.scheduler.runAfter(0, internal.email.sendOTP, {
                email: normalizedEmail,
                otpProvider: "resend",
                otpString,
                purpose: "password_reset",
            });
        } else {
            console.log(`[DEV OTP] Password reset code for ${normalizedEmail}: ${otpString}`);
        }

        return { status: "otp_sent", email: normalizedEmail };
    },
});

export const resetPasswordWithOTP = mutation({
    args: {
        email: v.string(),
        otpCode: v.string(),
        newPassword: v.string(),
    },
    handler: async (ctx, args) => {
        const normalizedEmail = args.email.toLowerCase().trim();

        if (args.newPassword.length < 8)
            throw new Error("Password must be at least 8 characters.");
        if (args.newPassword.length > 128)
            throw new Error("Password is too long (max 128 characters).");

        const verifyKey = buildRateLimitKey("auth", "verifyResetOtp", normalizedEmail);
        await assertRateLimit(ctx, verifyKey, { limit: 10, windowMs: 15 * 60 * 1000, message: "Too many verification attempts." });

        const request = await ctx.db
            .query("otp_requests")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .first();

        if (!request) {
            throw new Error("No active reset session found. Please request a new code.");
        }

        if (request.expiresAt < Date.now()) {
            await ctx.db.delete(request._id);
            throw new Error("Verification code has expired. Please request a new one.");
        }

        // M3: Timing-safe OTP hash comparison
        const incomingOtpHash = await sha256(args.otpCode);
        const storedOtpHash = request.otpCodeHash;
        if (incomingOtpHash.length !== storedOtpHash.length) {
            throw new Error("Invalid verification code.");
        }
        let otpDiff = 0;
        for (let i = 0; i < incomingOtpHash.length; i++) {
            otpDiff |= incomingOtpHash.charCodeAt(i) ^ storedOtpHash.charCodeAt(i);
        }
        if (otpDiff !== 0) {
            throw new Error("Invalid verification code.");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .first();

        if (!user) throw new Error("User not found.");

        const newPasswordHash = await hashPassword(args.newPassword);
        await ctx.db.patch(user._id, { passwordHash: newPasswordHash });

        // Revoke all active sessions for security
        const activeSessions = await ctx.db
            .query("sessions")
            .withIndex("by_userId_active", (q) => q.eq("userId", user._id).eq("isRevoked", false))
            .collect();
        for (const s of activeSessions) {
            await ctx.db.patch(s._id, { isRevoked: true });
        }

        // Clean up
        await ctx.db.delete(request._id);
        await clearRateLimit(ctx, verifyKey);

        return { status: "password_reset" };
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
        const normalizedEmail = args.email.toLowerCase().trim();

        // H1: DB-backed rate limiting
        if (args.ipAddress) {
            const globalKey = buildRateLimitKey("auth", "global", args.ipAddress);
            await assertRateLimit(ctx, globalKey, AUTH_RATE_LIMITS.global);
        }

        const signInKey = buildRateLimitKey("auth", "signIn", normalizedEmail, args.ipAddress);
        await assertRateLimit(ctx, signInKey, AUTH_RATE_LIMITS.signIn);

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) =>
                q.eq("email", normalizedEmail)
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
        await clearRateLimit(ctx, signInKey);
        return { userId: user._id, role: user.role, accessToken, refreshToken };
    },
});

// ─── Google Sign In ──────────────────────────────────────────────────────────

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

        const payload = await verifyGoogleIdToken(args.idToken, clientId);
        const normalizedEmail = payload.email;

        // H1: DB-backed rate limiting
        if (args.ipAddress) {
            const globalKey = buildRateLimitKey("auth", "global", args.ipAddress);
            await assertRateLimit(ctx, globalKey, AUTH_RATE_LIMITS.global);
        }

        const googleSignInKey = buildRateLimitKey("auth", "googleSignIn", normalizedEmail, args.ipAddress);
        await assertRateLimit(ctx, googleSignInKey, AUTH_RATE_LIMITS.googleSignIn);

        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .first();

        let userId: Id<"users">;

        if (existingUser) {
            userId = existingUser._id;
            const updates: any = { lastLoginProvider: "google" };

            const providers = existingUser.providers ?? ["local"];
            if (!providers.includes("google")) {
                updates.providers = [...new Set([...providers, "google"])];
            }

            if (!existingUser.avatarUrl && payload.picture) {
                updates.avatarUrl = payload.picture;
            }

            await ctx.db.patch(userId, updates);
        } else {
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

        const { accessToken, refreshToken } = await createSessionTokens(ctx, userId, args.deviceInfo, args.ipAddress);
        const user = (await ctx.db.get(userId))!;

        await clearRateLimit(ctx, googleSignInKey);
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
                pushToken: user.pushToken,
            };
        } catch {
            return null;
        }
    },
});

// ─── Refresh Session ─────────────────────────────────────────────────────────

export const refreshSession = mutation({
    args: { refreshToken: v.string() },
    handler: async (ctx, args) => {
        const secret = getRefreshTokenSecret();

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

        const incomingHash = await sha256(args.refreshToken);
        const storedHash = getSessionRefreshTokenHash(session);
        if (!storedHash || storedHash !== incomingHash) {
            console.error("[Auth] Security Alert: Sid-Hash mismatch for session", { sid });
            throw new Error("Invalid session data.");
        }

        if (session.expiresAt < Date.now()) {
            await ctx.db.patch(sid, { isRevoked: true });
            throw new Error("Session expired. Please sign in again.");
        }

        const userId = payload.sub as Id<"users">;

        if (isSessionRevoked(session)) {
            if (session.replacedBySessionId) {
                console.warn("[Auth] Stale refresh retry after rotation", {
                    userId,
                    sid,
                    replacedBySessionId: session.replacedBySessionId,
                });
            } else {
                console.warn("[Auth] Refresh token used for a revoked session", { userId, sid });
            }
            throw new Error("Session expired. Please sign in again.");
        }

        const { accessToken, refreshToken, sessionId: newSid } = await createSessionTokens(
            ctx,
            userId,
            session.deviceInfo,
            session.ipAddress
        );

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
            await ctx.db.patch(sid, { isRevoked: true });
        } catch {
            try {
                const refreshTokenHash = await sha256(args.refreshToken);
                const session = await ctx.db
                    .query("sessions")
                    .withIndex("by_refreshTokenHash", (q) => q.eq("refreshTokenHash", refreshTokenHash))
                    .first();

                if (session) {
                    await ctx.db.patch(session._id, { isRevoked: true });
                }
            } catch {
                // Ignore all errors during sign-out
            }
        }
    },
});

export const backfillLegacySessions = mutation({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);
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
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);
        const users = await ctx.db.query("users").collect();
        let updated = 0;

        for (const user of users) {
            if (user.providers && user.providers.length > 0) {
                continue;
            }

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

        if (args.newPassword.length < 8) {
            throw new Error("New password must be at least 8 characters.");
        }

        const changePasswordKey = buildRateLimitKey("auth", "changePassword", userId);
        await assertRateLimit(ctx, changePasswordKey, AUTH_RATE_LIMITS.changePassword);

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

        // M4: Use verifyPassword() to check sameness (PBKDF2 random salt makes hash comparison always fail)
        const isSamePassword = await verifyPassword(args.newPassword, user.passwordHash);
        if (isSamePassword) {
            throw new Error("New password must be different from the current password.");
        }

        const newPasswordHash = await hashPassword(args.newPassword);

        await ctx.db.patch(userId, {
            passwordHash: newPasswordHash,
        });

        // H6: Revoke all sessions after password change
        const activeSessions = await ctx.db
            .query("sessions")
            .withIndex("by_userId_active", (q) => q.eq("userId", userId).eq("isRevoked", false))
            .collect();
        for (const s of activeSessions) {
            await ctx.db.patch(s._id, { isRevoked: true });
        }

        await clearRateLimit(ctx, changePasswordKey);
        return true;
    },
});
