export type RentalLike = {
    status: string;
    totalRent?: number;
    lateFee?: number;
    createdAt: number;
    pickupDate?: string;
    paymentMethod?: "upi" | "cash";
    zone?: string;
};

type RevenueMetrics = {
    revenue: number;
    pendingRevenue: number;
    completedOrders: number;
    totalOrders: number;
    averageOrderValue: number;
    statusBreakdown: { label: string; value: number }[];
    paymentBreakdown: { label: string; value: number }[];
    zoneBreakdown: { label: string; value: number }[];
    weeklyTrend: {
        label: string;
        active: number;
        pending: number;
        completed: number;
    }[];
};

const COMPLETED_STATUSES = new Set(["paid", "returned"]);

const statusLabel = (status: string) =>
    ({
        requested: "Requested",
        delivery_scheduled: "Delivery",
        delivered: "Delivered",
        pickup_scheduled: "Pickup",
        payment_pending: "Pending",
        paid: "Paid",
        returned: "Returned",
    }[status] ?? status);

const getMonthKey = (date: Date) =>
    `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;

const parseMonthKey = (monthKey: string) => {
    const [year, month] = monthKey.split("-").map(Number);
    return new Date(year, month - 1, 1);
};

const getTrackingDate = (rental: RentalLike) =>
    rental.pickupDate ? new Date(`${rental.pickupDate}T00:00:00`) : new Date(rental.createdAt);

export const formatMonthLabel = (monthKey: string) =>
    parseMonthKey(monthKey).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
    });

export const getMonthOptions = (rentals: RentalLike[] | undefined, count = 6) => {
    const keys = new Set<string>();
    const now = new Date();

    for (let index = 0; index < count; index += 1) {
        keys.add(getMonthKey(new Date(now.getFullYear(), now.getMonth() - index, 1)));
    }

    (rentals ?? []).forEach((rental) => {
        keys.add(getMonthKey(new Date(rental.createdAt)));
    });

    return Array.from(keys)
        .sort((a, b) => (a < b ? 1 : -1))
        .slice(0, count)
        .map((key, index) => ({
            key,
            label:
                index === 0
                    ? "This Month"
                    : index === 1
                      ? "Last Month"
                      : formatMonthLabel(key),
            fullLabel: formatMonthLabel(key),
        }));
};

export const getCurrentMonthKey = () => getMonthKey(new Date());

export const getRevenueMetricsForMonth = (
    rentals: RentalLike[] | undefined,
    monthKey: string
): RevenueMetrics => {
    if (!rentals?.length) {
        return {
            revenue: 0,
            pendingRevenue: 0,
            completedOrders: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            statusBreakdown: [],
            paymentBreakdown: [],
            zoneBreakdown: [],
            weeklyTrend: [],
        };
    }

    const monthlyOrders = rentals.filter(
        (rental) => getMonthKey(new Date(rental.createdAt)) === monthKey
    );

    let revenue = 0;
    let pendingRevenue = 0;
    let completedOrders = 0;

    const statusCounts = new Map<string, number>();
    const paymentCounts = new Map<string, number>();
    const zoneCounts = new Map<string, number>();
    const weeklyCounts = new Map<
        string,
        { label: string; active: number; pending: number; completed: number }
    >();

    monthlyOrders.forEach((rental) => {
        const rentValue = (rental.totalRent ?? 0) + (rental.lateFee ?? 0);
        const createdDate = new Date(rental.createdAt);
        const weekBucket = Math.floor((createdDate.getDate() - 1) / 7) + 1;
        const weekKey = `Week ${weekBucket}`;
        const weeklyEntry = weeklyCounts.get(weekKey) ?? {
            label: weekKey,
            active: 0,
            pending: 0,
            completed: 0,
        };

        statusCounts.set(rental.status, (statusCounts.get(rental.status) ?? 0) + 1);
        zoneCounts.set(rental.zone || "Unknown", (zoneCounts.get(rental.zone || "Unknown") ?? 0) + 1);

        if (rental.paymentMethod) {
            paymentCounts.set(
                rental.paymentMethod.toUpperCase(),
                (paymentCounts.get(rental.paymentMethod.toUpperCase()) ?? 0) + 1
            );
        }

        if (COMPLETED_STATUSES.has(rental.status)) {
            revenue += rentValue;
            completedOrders += 1;
            weeklyEntry.completed += 1;
        } else if (rental.status === "payment_pending" || rental.status === "pickup_scheduled") {
            pendingRevenue += rentValue;
            weeklyEntry.pending += 1;
        } else {
            weeklyEntry.active += 1;
        }

        weeklyCounts.set(weekKey, weeklyEntry);
    });

    const toSortedBreakdown = (entries: Iterable<[string, number]>, labelMapper?: (label: string) => string) =>
        Array.from(entries)
            .sort((a, b) => b[1] - a[1])
            .map(([label, value]) => ({
                label: labelMapper ? labelMapper(label) : label,
                value,
            }));

    return {
        revenue,
        pendingRevenue,
        completedOrders,
        totalOrders: monthlyOrders.length,
        averageOrderValue: completedOrders > 0 ? Math.round(revenue / completedOrders) : 0,
        statusBreakdown: toSortedBreakdown(statusCounts.entries(), statusLabel),
        paymentBreakdown: toSortedBreakdown(paymentCounts.entries()),
        zoneBreakdown: toSortedBreakdown(zoneCounts.entries()),
        weeklyTrend: Array.from(weeklyCounts.values()).sort((a, b) =>
            a.label.localeCompare(b.label, undefined, { numeric: true })
        ),
    };
};
