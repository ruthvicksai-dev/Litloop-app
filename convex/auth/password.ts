import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import { getUserIdFromAccessToken, hashPassword, verifyPassword } from "../lib/authHelpers";
import { sha256 } from "../lib/jwt";
import { assertRateLimit, buildRateLimitKey, clearRateLimit } from "../lib/rateLimit";
import { AUTH_RATE_LIMITS } from "./helpers";

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

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .first();

        if (!user) {
            return { status: "otp_sent", email: normalizedEmail };
        }

        if (!user.passwordHash) {
            return { status: "otp_sent", email: normalizedEmail };
        }

        const previousRequests = await ctx.db
            .query("otp_requests")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .collect();
        for (const req of previousRequests) {
            await ctx.db.delete(req._id);
        }

        const isDevMode = process.env.USE_DEV_OTP === "true";
        const otpArray = crypto.getRandomValues(new Uint32Array(1));
        const otpString = isDevMode ? "123456" : (100000 + (otpArray[0] % 900000)).toString();
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

        const activeSessions = await ctx.db
            .query("sessions")
            .withIndex("by_userId_active", (q) => q.eq("userId", user._id).eq("isRevoked", false))
            .collect();
        for (const s of activeSessions) {
            await ctx.db.patch(s._id, { isRevoked: true });
        }

        await ctx.db.delete(request._id);
        await clearRateLimit(ctx, verifyKey);

        return { status: "password_reset" };
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
            userId = await getUserIdFromAccessToken(ctx, args.accessToken);
        } catch {
            throw new Error("Unauthenticated");
        }

        if (!args.currentPassword) {
            throw new Error("Current password is required.");
        }

        if (args.newPassword.length < 8) {
            throw new Error("New password must be at least 8 characters.");
        }
        if (args.newPassword.length > 128) {
            throw new Error("Password is too long (max 128 characters).");
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

        const isSamePassword = await verifyPassword(args.newPassword, user.passwordHash);
        if (isSamePassword) {
            throw new Error("New password must be different from the current password.");
        }

        const newPasswordHash = await hashPassword(args.newPassword);

        await ctx.db.patch(userId, {
            passwordHash: newPasswordHash,
        });

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
