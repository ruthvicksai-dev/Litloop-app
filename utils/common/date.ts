/**
 * Returns a human-readable string representing how long ago a timestamp was.
 * @param ts The timestamp in milliseconds.
 * @returns A string like "Just now", "5m ago", "2h ago", "3d ago", or a date string.
 */
export function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
}
