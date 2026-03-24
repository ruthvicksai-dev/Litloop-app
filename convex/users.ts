import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { assertAdmin, getAuthenticatedUser, getUserIdFromAccessToken } from "./lib/authHelpers";

export const getUser = query({
    args: { accessToken: v.string(), userId: v.id("users") },
    handler: async (ctx, args) => {
        const caller = await getAuthenticatedUser(ctx, args.accessToken);

        // Users can see themselves; Admins can see any user
        if (caller._id !== args.userId && caller.role !== "admin") {
            throw new Error("Unauthorized");
        }

        return await ctx.db.get(args.userId);
    },
});

export const listUsers = query({
    args: { accessToken: v.string(), paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);
        return await ctx.db.query("users").order("desc").paginate(args.paginationOpts);
    },
});

export const updateUser = mutation({
    args: {
        accessToken: v.string(),
        name: v.string(),
        phone: v.string(),
    },
    handler: async (ctx, args) => {
        let userId: Id<"users">;
        try {
            userId = await getUserIdFromAccessToken(args.accessToken);
        } catch {
            throw new Error("Unauthenticated");
        }

        // Validate
        if (!args.name.trim()) throw new Error("Name cannot be empty.");
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(args.phone.trim())) {
            throw new Error("Please provide a valid 10-digit phone number.");
        }

        await ctx.db.patch(userId, {
            name: args.name.trim(),
            phone: args.phone.trim(),
        });

        return true;
    },
});
