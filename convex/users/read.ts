import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "../_generated/server";
import { assertAdmin, getAuthenticatedUser } from "../lib/authHelpers";

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
