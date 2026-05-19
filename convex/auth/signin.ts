import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import { recordUserRegistered } from "../analytics";
import { hashPassword, verifyPassword } from "../lib/authHelpers";
import { verifyGoogleIdToken } from "../lib/google";
import { assertRateLimit, buildRateLimitKey, clearRateLimit } from "../lib/rateLimit";
import { AUTH_RATE_LIMITS, createSessionTokens } from "./helpers";

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
