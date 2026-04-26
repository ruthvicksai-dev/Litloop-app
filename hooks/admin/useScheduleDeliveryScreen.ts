import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TIME_SLOTS } from "@/utils/timeSlots";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";

export function useScheduleDeliveryScreen(rentalId: string) {
    const router = useRouter();
    const { showToast } = useToast();
    const { accessToken } = useAuth();
    const rental = useQuery(
        api.rentals.getRental,
        accessToken ? { accessToken, rentalId: rentalId as Id<"rentals"> } : "skip"
    );

    const [deliveryDate, setDeliveryDate] = useState("");
    const [deliveryTime, setDeliveryTime] = useState("");
    const [loading, setLoading] = useState(false);

    const scheduleMutation = useMutation(api.rentals.scheduleDelivery);

    const handleSchedule = async () => {
        if (!deliveryDate || !deliveryTime) {
            showToast("Please fill in all fields.", "error");
            return;
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
            showToast("Please select a valid date.", "error");
            return;
        }

        if (!TIME_SLOTS.some((s) => s.label === deliveryTime)) {
            showToast("Please select a valid time.", "error");
            return;
        }

        try {
            setLoading(true);
            if (!accessToken) throw new Error("Unauthenticated");
            await scheduleMutation({
                accessToken,
                rentalId: rentalId as Id<"rentals">,
                deliveryDate,
                deliveryTime,
            });
            showToast("Delivery scheduled successfully!", "success");
            router.back();
        } catch (error: any) {
            showToast(error.message || "Failed to schedule delivery.", "error");
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
