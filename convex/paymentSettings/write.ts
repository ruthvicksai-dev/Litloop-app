import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { insertAuditLog } from "../lib/auditLog";
import { assertAdmin } from "../lib/authHelpers";
import { MAX_UPI_IDS } from "./helpers";

/**
 * Admin-only: Add a new UPI ID. Max 2 allowed.
 */
export const addUpiId = mutation({
    args: {
        upiId: v.string(),
        merchantName: v.string(),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await assertAdmin(ctx, args.accessToken);

        const trimmedUpiId = args.upiId.trim();
        if (!trimmedUpiId || !trimmedUpiId.includes("@")) {
            throw new Error("Invalid UPI ID format. Must contain '@' (e.g., merchant@upi).");
        }

        const trimmedName = args.merchantName.trim();
        if (!trimmedName) {
            throw new Error("Merchant name is required.");
        }

        // Check max limit
        const existing = await ctx.db.query("payment_settings").collect();
        if (existing.length >= MAX_UPI_IDS) {
            throw new Error(`Maximum ${MAX_UPI_IDS} UPI IDs allowed. Remove one before adding another.`);
        }

        // Check duplicate
        const duplicate = existing.find(
            (s) => s.upiId.toLowerCase() === trimmedUpiId.toLowerCase()
        );
        if (duplicate) {
            throw new Error("This UPI ID already exists.");
        }

        // If no entries exist, make this one active by default
        const isFirstEntry = existing.length === 0;

        await ctx.db.insert("payment_settings", {
            upiId: trimmedUpiId,
            merchantName: trimmedName,
            active: isFirstEntry,
            qrEnabled: true,
            updatedAt: Date.now(),
            updatedBy: admin._id,
        });

        await insertAuditLog(ctx, "upi_id_added", admin._id, undefined, "payment_settings", {
            upiId: trimmedUpiId,
            merchantName: trimmedName,
            activatedByDefault: isFirstEntry,
        });
    },
});

/**
 * Admin-only: Toggle a UPI ID between active/inactive.
 * When activating, all other UPI IDs are deactivated (single-active).
 * When deactivating, the ID simply becomes inactive (zero active is allowed).
 */
export const toggleActiveUpiId = mutation({
    args: {
        settingId: v.id("payment_settings"),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await assertAdmin(ctx, args.accessToken);

        const target = await ctx.db.get(args.settingId);
        if (!target) throw new Error("UPI setting not found.");

        if (target.active) {
            // Deactivate — admin is turning this one off
            await ctx.db.patch(args.settingId, {
                active: false,
                updatedAt: Date.now(),
                updatedBy: admin._id,
            });

            await insertAuditLog(ctx, "upi_id_deactivated", admin._id, args.settingId as any, "payment_settings", {
                upiId: target.upiId,
            });
        } else {
            // Activate — deactivate all others first
            const all = await ctx.db.query("payment_settings").collect();
            for (const s of all) {
                if (s.active) {
                    await ctx.db.patch(s._id, { active: false });
                }
            }

            await ctx.db.patch(args.settingId, {
                active: true,
                updatedAt: Date.now(),
                updatedBy: admin._id,
            });

            await insertAuditLog(ctx, "upi_id_activated", admin._id, args.settingId as any, "payment_settings", {
                upiId: target.upiId,
            });
        }
    },
});

/**
 * Admin-only: Edit an existing UPI ID's details.
 */
export const updateUpiId = mutation({
    args: {
        settingId: v.id("payment_settings"),
        upiId: v.string(),
        merchantName: v.string(),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await assertAdmin(ctx, args.accessToken);

        const target = await ctx.db.get(args.settingId);
        if (!target) throw new Error("UPI setting not found.");

        const trimmedUpiId = args.upiId.trim();
        if (!trimmedUpiId || !trimmedUpiId.includes("@")) {
            throw new Error("Invalid UPI ID format. Must contain '@' (e.g., merchant@upi).");
        }

        const trimmedName = args.merchantName.trim();
        if (!trimmedName) {
            throw new Error("Merchant name is required.");
        }

        // Check duplicate (exclude self)
        const all = await ctx.db.query("payment_settings").collect();
        const duplicate = all.find(
            (s) => s._id !== args.settingId && s.upiId.toLowerCase() === trimmedUpiId.toLowerCase()
        );
        if (duplicate) {
            throw new Error("This UPI ID already exists.");
        }

        const oldUpiId = target.upiId;
        await ctx.db.patch(args.settingId, {
            upiId: trimmedUpiId,
            merchantName: trimmedName,
            updatedAt: Date.now(),
            updatedBy: admin._id,
        });

        await insertAuditLog(ctx, "upi_id_updated", admin._id, args.settingId as any, "payment_settings", {
            oldUpiId,
            newUpiId: trimmedUpiId,
            merchantName: trimmedName,
        });
    },
});

/**
 * Admin-only: Remove a UPI ID.
 */
export const removeUpiId = mutation({
    args: {
        settingId: v.id("payment_settings"),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await assertAdmin(ctx, args.accessToken);

        const target = await ctx.db.get(args.settingId);
        if (!target) throw new Error("UPI setting not found.");

        await ctx.db.delete(args.settingId);

        await insertAuditLog(ctx, "upi_id_removed", admin._id, args.settingId as any, "payment_settings", {
            upiId: target.upiId,
        });
    },
});

/**
 * Admin-only: Toggle QR code display for the active UPI ID.
 */
export const toggleQrEnabled = mutation({
    args: {
        settingId: v.id("payment_settings"),
        qrEnabled: v.boolean(),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await assertAdmin(ctx, args.accessToken);

        const target = await ctx.db.get(args.settingId);
        if (!target) throw new Error("UPI setting not found.");

        await ctx.db.patch(args.settingId, {
            qrEnabled: args.qrEnabled,
            updatedAt: Date.now(),
            updatedBy: admin._id,
        });

        await insertAuditLog(ctx, "qr_toggled", admin._id, args.settingId as any, "payment_settings", {
            qrEnabled: args.qrEnabled,
        });
    },
});
