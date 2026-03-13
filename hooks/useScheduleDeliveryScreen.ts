import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";

export function useScheduleDeliveryScreen(rentalId: string) {
    const rental = useQuery(api.rentals.getRental, {
        rentalId: rentalId as Id<"rentals">,
    });
    const { showToast } = useToast();
    const router = useRouter();
    const scheduleDelivery = useMutation(api.rentals.scheduleDelivery);

    const [deliveryDate, setDeliveryDate] = useState("");
    const [deliveryTime, setDeliveryTime] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSchedule = async () => {
        if (!deliveryDate) {
            showToast("Delivery date is required.", "error");
            return;
        }
        if (!deliveryTime) {
            showToast("Delivery time is required.", "error");
            return;
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
            showToast("Date should be in YYYY-MM-DD format.", "error");
            return;
        }

        setLoading(true);
        try {
            await scheduleDelivery({
                rentalId: rentalId as Id<"rentals">,
                deliveryDate,
                deliveryTime,
            });
            showToast("Delivery scheduled!", "success");
            router.back();
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to schedule delivery.";
            showToast(message, "error");
        } finally {
            setLoading(false);
        }
    };

    return {
        rental,
        deliveryDate,
        setDeliveryDate,
        deliveryTime,
        setDeliveryTime,
        loading,
        handleSchedule,
    };
}
