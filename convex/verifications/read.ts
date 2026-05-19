import { v } from "convex/values";
import { query } from "../_generated/server";
import { assertAdmin, getAuthenticatedUser } from "../lib/authHelpers";
import { COLLEGE_NAME } from "./helpers";

export const getUserVerification = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx, args.accessToken);

        // Return the most recent verification (pending first, then any)
        const pending = await ctx.db
            .query("student_verifications")
            .withIndex("by_userId_status", (q) =>
                q.eq("userId", user._id).eq("status", "pending")
            )
            .first();

        if (pending) {
            return { ...pending, collegeName: COLLEGE_NAME };
        }

        // Get latest (approved or rejected)
        const latest = await ctx.db
            .query("student_verifications")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .order("desc")
            .first();

        if (latest) {
            return { ...latest, collegeName: COLLEGE_NAME };
        }

        return null;
    },
});

export const getPendingVerifications = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);

        const pending = await ctx.db
            .query("student_verifications")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .order("asc")
            .take(50);

        // Enrich with user info and image URLs
        const enriched = await Promise.all(
            pending.map(async (v) => {
                const user = await ctx.db.get(v.userId);
                const imageUrl = await ctx.storage.getUrl(v.idCardImageId);
                return {
                    ...v,
                    userName: user?.name ?? "Unknown",
                    userEmail: user?.email ?? "",
                    idCardImageUrl: imageUrl,
                    collegeName: COLLEGE_NAME,
                };
            })
        );

        return enriched;
    },
});

export const getVerificationHistory = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);

        const history = await ctx.db
            .query("student_verifications")
            .withIndex("by_createdAt")
            .order("desc")
            .take(50);

        // Filter out pending (only show approved + rejected)
        const resolved = history.filter((v) => v.status !== "pending");

        const enriched = await Promise.all(
            resolved.map(async (v) => {
                const user = await ctx.db.get(v.userId);
                const imageUrl = await ctx.storage.getUrl(v.idCardImageId);
                let verifierName: string | undefined;
                if (v.verifiedBy) {
                    const verifier = await ctx.db.get(v.verifiedBy);
                    verifierName = verifier?.name;
                }
                return {
                    ...v,
                    userName: user?.name ?? "Unknown",
                    userEmail: user?.email ?? "",
                    idCardImageUrl: imageUrl,
                    collegeName: COLLEGE_NAME,
                    verifierName,
                };
            })
        );

        return enriched;
    },
});

export const getPendingVerificationCount = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);

        const pending = await ctx.db
            .query("student_verifications")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .take(100);

        return pending.length;
    },
});
