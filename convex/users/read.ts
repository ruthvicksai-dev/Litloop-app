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

        const user = await ctx.db.get(args.userId);
        if (!user) return null;

        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            role: user.role,
            isVerifiedStudent: user.isVerifiedStudent,
            acceptedTerms: user.acceptedTerms,
            createdAt: user.createdAt,
        };
    },
});

export const listUsers = query({
    args: { accessToken: v.string(), paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);
        const results = await ctx.db
            .query("users")
            .withIndex("by_createdAt")
            .order("desc")
            .paginate(args.paginationOpts);

        return {
            ...results,
            page: results.page.map((user) => ({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatarUrl: user.avatarUrl,
                role: user.role,
                isVerifiedStudent: user.isVerifiedStudent,
                acceptedTerms: user.acceptedTerms,
                createdAt: user.createdAt,
            })),
        };
    },
});
