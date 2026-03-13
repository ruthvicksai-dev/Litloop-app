import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";

const TIME_PATTERN = /^(0?[1-9]|1[0-2]):[0-5]\d (AM|PM)$/;

export function useScheduleReturnScreen(rentalId: string) {
    const rental = useQuery(api.rentals.getRental, {
        rentalId: rentalId as Id<"rentals">,
    });
    const { showToast } = useToast();
    const router = useRouter();
    const schedulePickup = useMutation(api.rentals.schedulePickup);

    const [pickupDate, setPickupDate] = useState("");
    const [pickupTime, setPickupTime] = useState("");
    const [loading, setLoading] = useState(false);

    const estimatedDays = useMemo(() => {
        if (!rental?.deliveryDate || !pickupDate) {
            return 0;
        }

        return Math.max(
            0,
            Math.ceil(
                (new Date(pickupDate).getTime() -
                    new Date(rental.deliveryDate).getTime()) /
                    (1000 * 60 * 60 * 24)
            )
        );
    }, [pickupDate, rental?.deliveryDate]);

    const estimatedRent = estimatedDays * (rental?.rentPerDay || 0);

    const handleSchedule = async () => {
        if (!pickupDate) {
            showToast("Pickup date is required.", "error");
            return;
        }
        if (!pickupTime) {
            showToast("Pickup time is required.", "error");
            return;
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate)) {
            showToast("Date should be in YYYY-MM-DD format.", "error");
            return;
        }

        if (!TIME_PATTERN.test(pickupTime)) {
            showToast("Please select a valid time.", "error");
            return;
        }

        if (
            rental?.deliveryDate &&
            new Date(pickupDate) <= new Date(rental.deliveryDate)
        ) {
            showToast("Pickup date must be after delivery date.", "error");
            return;
        }

        setLoading(true);
        try {
            await schedulePickup({
                rentalId: rentalId as Id<"rentals">,
                pickupDate,
                pickupTime,
            });
            showToast("Pickup scheduled! Proceed to payment.", "success");
            router.replace(`/rental/payment?rentalId=${rentalId}`);
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to schedule pickup.";
            showToast(message, "error");
        } finally {
            setLoading(false);
        }
    };

    return {
        rental,
        pickupDate,
        setPickupDate,
        pickupTime,
        setPickupTime,
        loading,
        estimatedDays,
        estimatedRent,
        handleSchedule,
    };
}
