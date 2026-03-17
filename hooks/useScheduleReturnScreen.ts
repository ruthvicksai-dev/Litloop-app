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
    const [userRating, setUserRating] = useState(0);
    const [loading, setLoading] = useState(false);

    // Pickup Address States
    const [useSameAddress, setUseSameAddress] = useState(true);
    const [phone, setPhone] = useState("");
    const [landmark, setLandmark] = useState("");
    const [area, setArea] = useState("");
    const [city, setCity] = useState("");
    const [roomNo, setRoomNo] = useState("");
    const [yearOfStudy, setYearOfStudy] = useState("");
    const [department, setDepartment] = useState("");
    const [rollNo, setRollNo] = useState("");
    const [latitude, setLatitude] = useState<number | undefined>(undefined);
    const [longitude, setLongitude] = useState<number | undefined>(undefined);
    const [formattedAddress, setFormattedAddress] = useState("");

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

        if (userRating < 1 || userRating > 5) {
            showToast("Please rate this book before scheduling pickup.", "error");
            return;
        }

        if (
            rental?.deliveryDate &&
            new Date(pickupDate) <= new Date(rental.deliveryDate)
        ) {
            showToast("Pickup date must be after delivery date.", "error");
            return;
        }

        let pickupLocation;
        if (useSameAddress && rental) {
            pickupLocation = rental.deliveryLocation;
        } else {
            if (!phone.trim()) {
                showToast("Pickup phone is required.", "error");
                return;
            }
            pickupLocation = {
                phone: phone.trim(),
                landmark: landmark.trim(),
                area: area.trim(),
                city: city.trim(),
                roomNo: roomNo.trim(),
                yearOfStudy: yearOfStudy.trim(),
                department: department.trim(),
                rollNo: rollNo.trim(),
                latitude,
                longitude,
                formattedAddress: formattedAddress.trim(),
            };
        }

        setLoading(true);
        try {
            await schedulePickup({
                rentalId: rentalId as Id<"rentals">,
                pickupDate,
                pickupTime,
                userRating,
                pickupLocation,
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
        userRating,
        setUserRating,
        loading,
        estimatedDays,
        estimatedRent,
        handleSchedule,
        // New Address Props
        useSameAddress,
        setUseSameAddress,
        phone,
        setPhone,
        landmark,
        setLandmark,
        area,
        setArea,
        city,
        setCity,
        roomNo,
        setRoomNo,
        yearOfStudy,
        setYearOfStudy,
        department,
        setDepartment,
        rollNo,
        setRollNo,
        latitude,
        setLatitude,
        longitude,
        setLongitude,
        formattedAddress,
        setFormattedAddress,
    };
}
