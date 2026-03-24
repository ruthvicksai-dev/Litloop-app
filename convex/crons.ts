import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * L4: Weekly notification cleanup — deletes user_notifications older than 90 days.
 * Runs every Sunday at 2:00 AM UTC. Capped at 500 deletions per run to stay
 * within Convex mutation time limits; re-runs next week for any remainder.
 */
crons.weekly(
    "cleanup-old-notifications",
    { dayOfWeek: "sunday", hourUTC: 2, minuteUTC: 0 },
    internal.notifications.cleanupOldNotifications,
    { ttlDays: 90 }
);

/**
 * L2: Nightly availableCopies reconciliation.
 * Verifies each book's availableCopies matches totalCopies - activeRentals
 * and corrects any divergence caused by bugs or failed transactions.
 */
crons.daily(
    "reconcile-available-copies",
    { hourUTC: 3, minuteUTC: 0 },
    internal.notifications.reconcileAvailableCopies,
    {}
);

export default crons;
