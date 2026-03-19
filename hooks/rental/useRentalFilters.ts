import { useState } from "react";

export type StatusFilter = "all" | "paid" | "returned";
export type TimeframeFilter = "all" | "last_30_days" | "this_month" | "this_year";

/**
 * Custom hook to handle rental history filtering state.
 */
export function useRentalFilters() {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [timeframeFilter, setTimeframeFilter] = useState<TimeframeFilter>("all");
    const [showFilters, setShowFilters] = useState(false);

    const toggleFilters = () => setShowFilters((current) => !current);

    return {
        statusFilter,
        setStatusFilter,
        timeframeFilter,
        setTimeframeFilter,
        showFilters,
        toggleFilters,
    };
}
