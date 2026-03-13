import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { formatMonthLabel, getCurrentMonthKey, getRevenueMetricsForMonth } from "@/utils/adminRevenueAnalytics";

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

export function useAdminDashboard() {
    const rentals = useQuery(api.rentals.getAllRentals);
    const markDelivered = useMutation(api.rentals.markDelivered);
    const markReturned = useMutation(api.rentals.markReturned);
    const { showToast } = useToast();
    const router = useRouter();
    const { signOut } = useAuth();
    const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");

    const stats = useMemo(() => {
        if (!rentals) {
            return { total: 0, active: 0, pending: 0, completed: 0 };
        }

        return {
            total: rentals.length,
            active: rentals.filter((rental) =>
                ["requested", "delivery_scheduled", "delivered"].includes(
                    rental.status
                )
            ).length,
            pending: rentals.filter((rental) =>
                ["pickup_scheduled", "payment_pending"].includes(rental.status)
            ).length,
            completed: rentals.filter((rental) =>
                ["paid", "returned"].includes(rental.status)
            ).length,
        };
    }, [rentals]);

    const revenue = useMemo(() => {
        const currentMonthKey = getCurrentMonthKey();
        const currentMonthMetrics = getRevenueMetricsForMonth(rentals, currentMonthKey);

        return {
            monthlyRevenue: currentMonthMetrics.revenue,
            monthlyOrders: currentMonthMetrics.totalOrders,
            currentMonthLabel: formatMonthLabel(currentMonthKey),
        };
    }, [rentals]);

    const filteredRentals = useMemo(() => {
        if (!rentals) {
            return [];
        }

        return statusFilter === "all"
            ? rentals
            : rentals.filter((rental) => rental.status === statusFilter);
    }, [rentals, statusFilter]);

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
            await markDelivered({ rentalId: rentalId as Id<"rentals"> });
            showToast("Marked as delivered.", "success");
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to update rental.";
            showToast(message, "error");
        }
    };

    const handleMarkReturned = async (rentalId: string) => {
        try {
            await markReturned({ rentalId: rentalId as Id<"rentals"> });
            showToast("Marked as returned.", "success");
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to update rental.";
            showToast(message, "error");
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace("/(auth)/sign-in");
    };

    return {
        rentals,
        stats,
        revenue,
        statusFilter,
        setStatusFilter,
        groupedByZone,
        handleMarkDelivered,
        handleMarkReturned,
        handleSignOut,
        statusFilters: STATUS_FILTERS,
    };
}
