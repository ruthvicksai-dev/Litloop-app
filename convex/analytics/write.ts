import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { assertAdmin } from "../lib/authHelpers";
import { DASHBOARD_COUNTERS_REBUILD_KEY, setCounter } from "./helpers";

export const rebuildDashboardCounters = mutation({
    args: {
        accessToken: v.string(),
        paginationOpts: paginationOptsValidator,
        reset: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);

        const existingState = await ctx.db
            .query("system_state")
            .withIndex("by_key", (q) => q.eq("key", DASHBOARD_COUNTERS_REBUILD_KEY))
            .first();

        if (args.reset && existingState) {
            await ctx.db.delete(existingState._id);
        }

        const state = args.reset
            ? null
            : existingState?.value
                ? JSON.parse(existingState.value)
                : null;
        const startingState = state ?? {
            usersCursor: null,
            rentalsCursor: null,
            totalUsers: 0,
            totalRentals: 0,
            activeRentals: 0,
            usersDone: false,
            rentalsDone: false,
        };

        let nextState = { ...startingState };
        let scannedUsers = 0;
        let scannedRentals = 0;

        if (!nextState.usersDone) {
            const userResults = await ctx.db
                .query("users")
                .withIndex("by_createdAt")
                .paginate({
                    ...args.paginationOpts,
                    cursor: nextState.usersCursor,
                });
            scannedUsers = userResults.page.length;
            nextState = {
                ...nextState,
                usersCursor: userResults.isDone ? null : userResults.continueCursor,
                totalUsers: nextState.totalUsers + userResults.page.length,
                usersDone: userResults.isDone,
            };
        }

        if (!nextState.rentalsDone) {
            const rentalResults = await ctx.db
                .query("rentals")
                .withIndex("by_createdAt")
                .paginate({
                    ...args.paginationOpts,
                    cursor: nextState.rentalsCursor,
                });
            scannedRentals = rentalResults.page.length;
            nextState = {
                ...nextState,
                rentalsCursor: rentalResults.isDone ? null : rentalResults.continueCursor,
                totalRentals: nextState.totalRentals + rentalResults.page.length,
                activeRentals:
                    nextState.activeRentals +
                    rentalResults.page.filter((r: any) => r.status !== "returned").length,
                rentalsDone: rentalResults.isDone,
            };
        }

        const isDone = nextState.usersDone && nextState.rentalsDone;
        if (isDone) {
            await setCounter(ctx, "totalUsers", nextState.totalUsers);
            await setCounter(ctx, "totalRentals", nextState.totalRentals);
            await setCounter(ctx, "activeRentals", nextState.activeRentals);
            await setCounter(ctx, "dashboardCountersReady", 1);

            const savedState = await ctx.db
                .query("system_state")
                .withIndex("by_key", (q) => q.eq("key", DASHBOARD_COUNTERS_REBUILD_KEY))
                .first();
            if (savedState) {
                await ctx.db.delete(savedState._id);
            }
        } else {
            const payload = JSON.stringify(nextState);
            const savedState = await ctx.db
                .query("system_state")
                .withIndex("by_key", (q) => q.eq("key", DASHBOARD_COUNTERS_REBUILD_KEY))
                .first();

            if (savedState) {
                await ctx.db.patch(savedState._id, {
                    value: payload,
                    updatedAt: Date.now(),
                });
            } else {
                await ctx.db.insert("system_state", {
                    key: DASHBOARD_COUNTERS_REBUILD_KEY,
                    value: payload,
                    updatedAt: Date.now(),
                });
            }
        }

        return {
            scannedUsers,
            scannedRentals,
            totals: {
                totalUsers: nextState.totalUsers,
                totalRentals: nextState.totalRentals,
                activeRentals: nextState.activeRentals,
            },
            isDone,
        };
    },
});
