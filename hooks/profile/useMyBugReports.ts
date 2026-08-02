import { useAuthState } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

/**
 * Fetches the authenticated user's bug reports from Convex.
 * Returns undefined while loading, or an array of report summaries.
 */
export function useMyBugReports() {
    const { accessToken } = useAuthState();

    const reports = useQuery(
        api.bugReports.getUserBugReports,
        accessToken ? { accessToken } : "skip"
    );

    return { reports };
}
