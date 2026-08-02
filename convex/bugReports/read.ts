import { v } from "convex/values";
import { query } from "../_generated/server";
import { getUserIdFromAccessToken } from "../lib/authHelpers";

/**
 * Returns all bug reports submitted by the authenticated user,
 * ordered by most recent first.
 */
export const getUserBugReports = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        const userId = await getUserIdFromAccessToken(ctx, args.accessToken);

        const reports = await ctx.db
            .query("bug_reports")
            .withIndex("by_userId_createdAt", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();

        return reports.map((r) => ({
            _id: r._id,
            reportId: r.reportId,
            title: r.title,
            category: r.category,
            status: r.status,
            priority: r.priority,
            githubIssueNumber: r.githubIssueNumber,
            githubIssueUrl: r.githubIssueUrl,
            createdAt: r.createdAt,
        }));
    },
});
