import { v } from "convex/values";
import { query } from "../_generated/server";
import { assertAdmin, getAuthenticatedUser } from "../lib/authHelpers";

/**
 * S-02 FIX: Returns the active payment settings for the frontend QR/UPI flow.
 * Now requires authentication to prevent unauthenticated enumeration of
 * merchant payment identity (phishing risk).
 */
export const getActiveSettings = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        await getAuthenticatedUser(ctx, args.accessToken);

        const settings = await ctx.db
            .query("payment_settings")
            .withIndex("by_active", (q) => q.eq("active", true))
            .first();

        if (!settings) return null;

        return {
            upiId: settings.upiId,
            merchantName: settings.merchantName,
            qrEnabled: settings.qrEnabled,
        };
    },
});

/**
 * Admin-only: Returns all configured UPI IDs (active + inactive).
 */
export const getAllSettings = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);

        const all = await ctx.db
            .query("payment_settings")
            .collect();

        return all.map((s) => ({
            _id: s._id,
            upiId: s.upiId,
            merchantName: s.merchantName,
            active: s.active,
            qrEnabled: s.qrEnabled,
            updatedAt: s.updatedAt,
        }));
    },
});
