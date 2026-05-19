import { v } from "convex/values";
import { internal } from "../_generated/api";
import { mutation } from "../_generated/server";
import { recordUserRegistered } from "../analytics";
import { hashPassword } from "../lib/authHelpers";
import { sha256 } from "../lib/jwt";
import { assertRateLimit, buildRateLimitKey, clearRateLimit } from "../lib/rateLimit";
import { AUTH_RATE_LIMITS, createSessionTokens, normalizePhone } from "./helpers";

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

        if (args.ipAddress) {
            const globalKey = buildRateLimitKey("auth", "global", args.ipAddress);
            await assertRateLimit(ctx, globalKey, AUTH_RATE_LIMITS.global);
        }

        const otpRequestKey = buildRateLimitKey("auth", "otpRequest", normalizedEmail, args.ipAddress);
        await assertRateLimit(ctx, otpRequestKey, { limit: 3, windowMs: 15 * 60 * 1000, message: "Too many OTP requests. Please wait." });

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
        const preHashedPassword = await hashPassword(args.password);

        await ctx.db.insert("otp_requests", {
            email: normalizedEmail,
            otpCodeHash,
            signupData: JSON.stringify({
                name: args.name.trim(),
                phone: normalizedPhone,
                passwordHash: preHashedPassword,
                deviceInfo: args.deviceInfo,
                ipAddress: args.ipAddress,
            }),
            expiresAt: Date.now() + 10 * 60 * 1000,
            isVerified: false,
            createdAt: Date.now(),
        });

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

        if (!request.signupData) throw new Error("Registration data lost.");
        const signupData = JSON.parse(request.signupData);

        const passwordHash = signupData.passwordHash;
        if (!passwordHash) throw new Error("Registration data corrupted. Please sign up again.");

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

        await ctx.db.delete(request._id);
        await clearRateLimit(ctx, verifyOtpKey);

        return { userId, accessToken, refreshToken };
    },
});
