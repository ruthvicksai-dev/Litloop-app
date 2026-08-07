import { useAuthActions, useAuthState } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useRef, useState } from "react";

const STATUS_FILTERS = [
    "all",
    "requested",
    "delivery_scheduled",
    "delivered",
    "pickup_scheduled",
    "payment_pending",
    "paid",
    "returned",
] as const;

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning,";
    if (hour < 17) return "Good Afternoon,";
    return "Good Evening,";
}

export function useAdminDashboard() {
    const { showToast } = useToast();
    const { accessToken } = useAuthState();
    const { signOut } = useAuthActions();
    const rentals = useQuery(
        api.rentals.getAllRentals,
        accessToken
            ? {
                accessToken,
                paginationOpts: {
                    cursor: null,
                    numItems: 50, // admin can load more
                },
            }
            : "skip"
    );

    // Cache last valid rentals so unmounting during sign-out never reverts to undefined or triggers BookLoader
    const lastValidRentalsRef = useRef<typeof rentals>(undefined);
    if (rentals !== undefined) {
        lastValidRentalsRef.current = rentals;
    }
    const effectiveRentals = rentals ?? lastValidRentalsRef.current;

    const markDelivered = useMutation(api.rentals.markDelivered);
    const markReturned = useMutation(api.rentals.markReturned);
    const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");

    // Revenue from the same pre-aggregated table as the analytics page
    const serverRevenue = useQuery(
        api.analytics.getDashboardRevenue,
        accessToken ? { accessToken } : "skip"
    );
    const lastValidRevenueRef = useRef<typeof serverRevenue>(undefined);
    if (serverRevenue !== undefined) {
        lastValidRevenueRef.current = serverRevenue;
    }
    const effectiveRevenue = serverRevenue ?? lastValidRevenueRef.current;

    // Lightweight dashboard stats for badges, today's metrics, total books, growth
    const dashboardStatsRaw = useQuery(
        api.rentals.getDashboardStats,
        accessToken ? { accessToken } : "skip"
    );
    const lastValidDashboardStatsRef = useRef<typeof dashboardStatsRaw>(undefined);
    if (dashboardStatsRaw !== undefined) {
        lastValidDashboardStatsRef.current = dashboardStatsRaw;
    }
    const dashboardStats = dashboardStatsRaw ?? lastValidDashboardStatsRef.current;

    const stats = useMemo(() => {
        const rentalList = effectiveRentals?.page ?? [];

        return {
            total: rentalList.length,
            active: rentalList.filter((rental) =>
                ["requested", "delivery_scheduled", "delivered"].includes(rental.status)
            ).length,
            pending: rentalList.filter((rental) =>
                ["pickup_scheduled", "payment_pending"].includes(rental.status)
            ).length,
            completed: rentalList.filter((rental) =>
                ["paid", "returned"].includes(rental.status)
            ).length,
        };
    }, [effectiveRentals]);

    const revenue = useMemo(() => {
        if (effectiveRevenue) return effectiveRevenue;
        return { monthlyRevenue: 0, monthlyOrders: 0, currentMonthLabel: "" };
    }, [effectiveRevenue]);

    const filteredRentals = useMemo(() => {
        const rentalList = effectiveRentals?.page ?? [];

        return statusFilter === "all"
            ? rentalList
            : rentalList.filter((rental) => rental.status === statusFilter);
    }, [effectiveRentals, statusFilter]);

    const groupedByZone = useMemo(() => {
        const groups: Record<string, typeof filteredRentals> = {};

        filteredRentals.forEach((rental) => {
            const zone = rental.zone || "Unknown";
            if (!groups[zone]) {
                groups[zone] = [];
            }
            groups[zone].push(rental);
        });

        return Object.entries(groups).map(([title, data]) => ({ title, data }));
    }, [filteredRentals]);

    const handleMarkDelivered = async (rentalId: string) => {
        try {
            if (!accessToken) throw new Error("Unauthenticated");
            await markDelivered({ accessToken, rentalId: rentalId as Id<"rentals"> });
            showToast("Marked as delivered.", "success");
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to update rental.";
            showToast(message, "error");
        }
    };

    const handleMarkReturned = async (rentalId: string) => {
        try {
            if (!accessToken) throw new Error("Unauthenticated");
            await markReturned({ accessToken, rentalId: rentalId as Id<"rentals"> });
            showToast("Marked as returned.", "success");
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to update rental.";
            showToast(message, "error");
        }
    };

    const handleSignOut = async () => {
        await signOut();
    };

    const greeting = useMemo(() => getGreeting(), []);

    return {
        rentals: effectiveRentals,
        stats,
        revenue,
        statusFilter,
        setStatusFilter,
        groupedByZone,
        handleMarkDelivered,
        handleMarkReturned,
        handleSignOut,
        statusFilters: STATUS_FILTERS,
        dashboardStats,
        greeting,
    };
}
