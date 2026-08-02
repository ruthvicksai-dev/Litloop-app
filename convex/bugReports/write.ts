import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, internalMutation, internalQuery, mutation } from "../_generated/server";
import { insertAuditLog } from "../lib/auditLog";
import { getAuthenticatedUser } from "../lib/authHelpers";
import { assertRateLimit, buildRateLimitKey } from "../lib/rateLimit";
import {
    BUG_CATEGORIES,
    BUG_REPORT_RATE_LIMITS,
    CATEGORY_LABELS,
    CATEGORY_PRIORITY,
    FIELD_LIMITS,
    MAX_SCREENSHOT_SIZE_BYTES,
} from "./helpers";
import type { BugCategory } from "./helpers";

/**
 * Generates a short upload URL for screenshot attachments.
 * Auth-gated and rate-limited.
 */
export const generateUploadUrl = mutation({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx, args.accessToken);

        const key = buildRateLimitKey("bugReport", "upload", user._id);
        await assertRateLimit(ctx as any, key, BUG_REPORT_RATE_LIMITS.uploadUrl);

        return await ctx.storage.generateUploadUrl();
    },
});

/**
 * Submits a new bug report. Validates all inputs server-side, generates a
 * unique report ID, assigns priority from category, and schedules async
 * GitHub issue creation.
 */
export const submitBugReport = mutation({
    args: {
        accessToken: v.string(),
        title: v.string(),
        category: v.string(),
        description: v.string(),
        stepsToReproduce: v.optional(v.string()),
        expectedBehaviour: v.optional(v.string()),
        actualBehaviour: v.optional(v.string()),
        screenshotId: v.optional(v.id("_storage")),
        contactMe: v.boolean(),
        deviceInfo: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx, args.accessToken);
        const userId = user._id;
        const now = Date.now();

        // Rate limit
        const submitKey = buildRateLimitKey("bugReport", "submit", userId);
        await assertRateLimit(ctx as any, submitKey, BUG_REPORT_RATE_LIMITS.submit);

        // Validate category
        if (!BUG_CATEGORIES.includes(args.category as BugCategory)) {
            throw new Error("Invalid bug category.");
        }

        // Validate required fields
        const title = args.title.trim();
        const description = args.description.trim();
        if (title.length < FIELD_LIMITS.title.min || title.length > FIELD_LIMITS.title.max) {
            throw new Error(`Title must be between ${FIELD_LIMITS.title.min} and ${FIELD_LIMITS.title.max} characters.`);
        }
        if (description.length < FIELD_LIMITS.description.min || description.length > FIELD_LIMITS.description.max) {
            throw new Error(`Description must be between ${FIELD_LIMITS.description.min} and ${FIELD_LIMITS.description.max} characters.`);
        }

        // Validate optional fields length
        const steps = args.stepsToReproduce?.trim() || undefined;
        const expected = args.expectedBehaviour?.trim() || undefined;
        const actual = args.actualBehaviour?.trim() || undefined;
        if (steps && steps.length > FIELD_LIMITS.steps.max) {
            throw new Error(`Steps to reproduce must be under ${FIELD_LIMITS.steps.max} characters.`);
        }
        if (expected && expected.length > FIELD_LIMITS.expected.max) {
            throw new Error(`Expected behaviour must be under ${FIELD_LIMITS.expected.max} characters.`);
        }
        if (actual && actual.length > FIELD_LIMITS.actual.max) {
            throw new Error(`Actual behaviour must be under ${FIELD_LIMITS.actual.max} characters.`);
        }

        // Validate screenshot if provided
        let screenshotUrl: string | undefined;
        if (args.screenshotId) {
            const fileMeta = await ctx.storage.getMetadata(args.screenshotId);
            if (!fileMeta) {
                throw new Error("Uploaded file not found. Please try uploading again.");
            }
            if (fileMeta.size > MAX_SCREENSHOT_SIZE_BYTES) {
                await ctx.storage.delete(args.screenshotId);
                throw new Error("Screenshot must be under 5 MB.");
            }
            const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
            if (fileMeta.contentType && !allowedTypes.includes(fileMeta.contentType)) {
                await ctx.storage.delete(args.screenshotId);
                throw new Error("Only JPEG, PNG, or WebP images are accepted.");
            }
            const url = await ctx.storage.getUrl(args.screenshotId);
            screenshotUrl = url ?? undefined;
        }

        // Generate unique report ID (LL-XXXXX)
        const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
        const reportId = `LL-${randomPart}`;

        // Determine priority from category
        const category = args.category as BugCategory;
        const priority = CATEGORY_PRIORITY[category] ?? "low";

        // Insert report
        const docId = await ctx.db.insert("bug_reports", {
            reportId,
            userId,
            title,
            category: args.category,
            description,
            stepsToReproduce: steps,
            expectedBehaviour: expected,
            actualBehaviour: actual,
            screenshotId: args.screenshotId,
            screenshotUrl,
            contactMe: args.contactMe,
            deviceInfo: args.deviceInfo,
            status: "open",
            priority,
            createdAt: now,
            updatedAt: now,
        });

        // Audit log
        await insertAuditLog(ctx, "bugReport.submitted", userId, docId as unknown as string, "bug_report", {
            reportId,
            category: args.category,
        });

        // Schedule GitHub issue creation (fire-and-forget async action)
        await ctx.scheduler.runAfter(0, internal.bugReports.createGitHubIssue, {
            bugReportId: docId,
        });

        return { reportId, docId };
    },
});

/**
 * Internal query to fetch bug report details for GitHub issue creation.
 */
export const getReportForGitHub = internalQuery({
    args: { bugReportId: v.id("bug_reports") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.bugReportId);
    },
});

/**
 * Internal mutation to update GitHub issue metadata after successful creation.
 */
export const updateGitHubIssueInfo = internalMutation({
    args: {
        bugReportId: v.id("bug_reports"),
        githubIssueNumber: v.number(),
        githubIssueUrl: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.bugReportId, {
            githubIssueNumber: args.githubIssueNumber,
            githubIssueUrl: args.githubIssueUrl,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Server-side action that creates a GitHub issue for the bug report.
 * Reads GITHUB_PAT from environment variables — never exposed to client.
 * On failure, the bug report remains saved; only the GitHub link is missing.
 */
export const createGitHubIssue = internalAction({
    args: { bugReportId: v.id("bug_reports") },
    handler: async (ctx, args) => {
        const report = await ctx.runQuery(internal.bugReports.getReportForGitHub, {
            bugReportId: args.bugReportId,
        });
        if (!report) return;

        const githubPat = process.env.GITHUB_PAT;
        const repoOwner = process.env.GITHUB_REPO_OWNER;
        const repoName = process.env.GITHUB_REPO_NAME;

        if (!githubPat || !repoOwner || !repoName) {
            // GitHub integration not configured — silently skip
            console.warn("[BugReport] GitHub env vars not configured, skipping issue creation.");
            return;
        }

        // Parse device info
        let deviceInfo: Record<string, string> = {};
        try {
            deviceInfo = JSON.parse(report.deviceInfo);
        } catch {
            // Ignore parse errors
        }

        // Build GitHub issue body
        const category = report.category as BugCategory;
        const labels = CATEGORY_LABELS[category] ?? ["bug"];

        const issueTitle = `[Bug] ${report.title}`;
        const issueBody = [
            `## 🐞 Bug Report: ${report.title}`,
            "",
            `**Report ID:** \`${report.reportId}\``,
            `**Category:** ${report.category}`,
            `**Priority:** ${report.priority}`,
            `**Status:** ${report.status}`,
            "",
            "---",
            "",
            "### Description",
            report.description,
            "",
            report.stepsToReproduce ? `### Steps to Reproduce\n${report.stepsToReproduce}\n` : "",
            report.expectedBehaviour ? `### Expected Behaviour\n${report.expectedBehaviour}\n` : "",
            report.actualBehaviour ? `### Actual Behaviour\n${report.actualBehaviour}\n` : "",
            "---",
            "",
            "### Device & Environment",
            "",
            `| Field | Value |`,
            `|-------|-------|`,
            `| **Platform** | ${deviceInfo.platform ?? "N/A"} |`,
            `| **OS Version** | ${deviceInfo.osVersion ?? "N/A"} |`,
            `| **Device** | ${deviceInfo.deviceModel ?? "N/A"} |`,
            `| **Manufacturer** | ${deviceInfo.manufacturer ?? "N/A"} |`,
            `| **App Version** | ${deviceInfo.appVersion ?? "N/A"} |`,
            `| **Build Number** | ${deviceInfo.buildNumber ?? "N/A"} |`,
            `| **Current Screen** | ${deviceInfo.currentScreen ?? "N/A"} |`,
            `| **Network** | ${deviceInfo.networkStatus ?? "N/A"} |`,
            `| **Timezone** | ${deviceInfo.timezone ?? "N/A"} |`,
            `| **Language** | ${deviceInfo.language ?? "N/A"} |`,
            `| **User ID** | \`${deviceInfo.userId ?? "N/A"}\` |`,
            `| **Sentry Event ID** | ${deviceInfo.sentryEventId ?? "N/A"} |`,
            `| **Timestamp** | ${new Date(report.createdAt).toISOString()} |`,
            "",
            report.screenshotUrl ? `### Screenshot\n![Screenshot](${report.screenshotUrl})\n` : "",
            `### Contact`,
            report.contactMe ? `User has opted in to be contacted regarding this issue.` : `User has not opted in for contact.`,
            deviceInfo.email ? `**Email:** ${deviceInfo.email}` : "",
            deviceInfo.phone ? `**Phone:** ${deviceInfo.phone}` : "",
        ]
            .filter(Boolean)
            .join("\n");

        try {
            const response = await fetch(
                `https://api.github.com/repos/${repoOwner}/${repoName}/issues`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${githubPat}`,
                        Accept: "application/vnd.github+json",
                        "Content-Type": "application/json",
                        "X-GitHub-Api-Version": "2022-11-28",
                    },
                    body: JSON.stringify({
                        title: issueTitle,
                        body: issueBody,
                        labels,
                    }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                await ctx.runMutation(internal.bugReports.updateGitHubIssueInfo, {
                    bugReportId: args.bugReportId,
                    githubIssueNumber: data.number as number,
                    githubIssueUrl: data.html_url as string,
                });
            } else {
                const errorText = await response.text();
                console.error(`[BugReport] GitHub issue creation failed (${response.status}): ${errorText}`);
            }
        } catch (error) {
            console.error("[BugReport] GitHub issue creation error:", error);
        }
    },
});
