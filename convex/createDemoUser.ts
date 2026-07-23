import { mutation } from "./_generated/server";
import { hashPassword } from "./lib/authHelpers";

export const createDemoUser = mutation({
    handler: async (ctx) => {
        const email = "testuser@gmail.com";
        const password = "TestPass123";
        const name = "Demo User Account";
        const phone = "9876543210";

        const existing = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();

        const passwordHash = await hashPassword(password);

        if (existing) {
            await ctx.db.patch(existing._id, {
                name,
                passwordHash,
                providers: ["local"],
                lastLoginProvider: "local",
                role: "user",
            });
            return { action: "updated", userId: existing._id };
        } else {
            const userId = await ctx.db.insert("users", {
                name,
                email,
                phone,
                passwordHash,
                providers: ["local"],
                lastLoginProvider: "local",
                role: "user",
                acceptedTerms: true,
                acceptedAt: Date.now(),
                createdAt: Date.now(),
            });
            return { action: "created", userId };
        }
    },
});
