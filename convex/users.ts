import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { verifyToken } from "./lib/jwt";

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET environment variable is not set.");
    }
    return secret;
}

async function getUserIdFromAccessToken(accessToken: string): Promise<Id<"users">> {
    const secret = getJwtSecret();
    const payload = await verifyToken(accessToken, secret);
    if (payload.type !== "access") {
        throw new Error("Invalid token type.");
    }
    return payload.sub as Id<"users">;
}

export const getUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    },
});

export const listUsers = query({
    args: { paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
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
