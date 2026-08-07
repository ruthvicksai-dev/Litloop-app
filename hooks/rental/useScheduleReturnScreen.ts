import { useAuthState } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getPhoneValidationError, normalizePhoneNumber } from "@/utils";
import { TIME_SLOTS } from "@/utils";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useMemo, useState, useEffect } from "react";

export function useScheduleReturnScreen(rentalId: string) {
    const { accessToken } = useAuthState();
    const rental = useQuery(
        api.rentals.getRental,
        accessToken ? { accessToken, rentalId: rentalId as Id<"rentals"> } : "skip"
    );
    const { showToast } = useToast();
    const router = useRouter();
    const schedulePickup = useMutation(api.rentals.schedulePickup);

    const [pickupDate, setPickupDate] = useState("");
    const [pickupTime, setPickupTime] = useState("");
    const [userRating, setUserRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [loading, setLoading] = useState(false);

    // Pickup Address States
    const [useSameAddress, setUseSameAddress] = useState(true);
    const [pickupZone, setPickupZone] = useState("Home");
    const [phone, setPhone] = useState("");
    const [area, setArea] = useState("");
    const [landmark, setLandmark] = useState("");
    const [roomNo, setRoomNo] = useState("");
    const [yearOfStudy, setYearOfStudy] = useState("");
    const [department, setDepartment] = useState("");
    const [rollNo, setRollNo] = useState("");
    const [latitude, setLatitude] = useState<number | undefined>(undefined);
    const [longitude, setLongitude] = useState<number | undefined>(undefined);
    const [formattedAddress, setFormattedAddress] = useState("");

    // Initialize pickupZone from rental zone once it loads
    useEffect(() => {
        if (rental?.zone) {
            setPickupZone(rental.zone);
        }
    }, [rental?.zone]);

    const handleSetUseSameAddress = (val: boolean) => {
        setUseSameAddress(val);
        if (val) {
            if (rental?.zone) {
                setPickupZone(rental.zone);
            }
            setPhone("");
            setArea("");
            setLandmark("");
            setRoomNo("");
            setYearOfStudy("");
            setDepartment("");
            setRollNo("");
            setLatitude(undefined);
            setLongitude(undefined);
            setFormattedAddress("");
        }
    };

    const estimatedDays = useMemo(() => {
        const deliveryTimestamp = rental?.deliveredAt
            ? rental.deliveredAt
            : (rental?.deliveryDate ? new Date(rental.deliveryDate).getTime() : 0);

        if (!deliveryTimestamp) return 1;

        const targetTime = pickupDate ? new Date(pickupDate).getTime() : Date.now();
        const diffMs = Math.max(0, targetTime - deliveryTimestamp);
        return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    }, [pickupDate, rental?.deliveryDate, rental?.deliveredAt]);

    const estimatedRent = estimatedDays * (rental?.rentPerDay || 0);

    const handleSchedule = async () => {
        const deliveryTimestamp = rental?.deliveredAt
            ? rental.deliveredAt
            : (rental?.deliveryDate ? new Date(rental.deliveryDate).getTime() : 0);

        const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
        const elapsed = Date.now() - deliveryTimestamp;
        if (deliveryTimestamp > 0 && elapsed < TWELVE_HOURS_MS) {
            const hoursLeft = Math.ceil((TWELVE_HOURS_MS - elapsed) / (1000 * 60 * 60));
            showToast(`Return pickup can strictly be scheduled only 12 hours after delivery (${hoursLeft}h remaining).`, "error");
            return;
        }

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

        if (!TIME_SLOTS.some((s) => s.label === pickupTime)) {
            showToast("Please select a valid time.", "error");
            return;
        }

        if (userRating < 1 || userRating > 5) {
            showToast("Please rate this book before scheduling pickup.", "error");
            return;
        }

        let pickupLocation;
        if (!useSameAddress) {
            const phoneError = getPhoneValidationError(phone, "Pickup phone number");
            if (phoneError) {
                showToast(phoneError, "error");
                return;
            }
            if (pickupZone === "Home" && !area.trim()) {
                showToast("Please select your pickup area.", "error");
                return;
            }
            if (pickupZone === "College") {
                if (!roomNo.trim()) {
                    showToast("Room number is required for College pickup.", "error");
                    return;
                }
                if (!rollNo.trim()) {
                    showToast("Roll number is required for College pickup.", "error");
                    return;
                }
            }

            pickupLocation = {
                phone: normalizePhoneNumber(phone),
                area: pickupZone === "Home" ? area.trim() : undefined,
                landmark: landmark.trim() || undefined,
                roomNo: pickupZone === "College" ? roomNo.trim() : undefined,
                yearOfStudy: pickupZone === "College" ? yearOfStudy.trim() : undefined,
                department: pickupZone === "College" ? department.trim() : undefined,
                rollNo: pickupZone === "College" ? rollNo.trim() : undefined,
                latitude: pickupZone === "Home" ? latitude : undefined,
                longitude: pickupZone === "Home" ? longitude : undefined,
                formattedAddress: formattedAddress.trim() || undefined,
            };
        }

        setLoading(true);
        try {
            if (!accessToken) throw new Error("Unauthenticated");
            await schedulePickup({
                accessToken,
                rentalId: rentalId as Id<"rentals">,
                pickupDate,
                pickupTime,
                userRating,
                reviewText: reviewText.trim() || undefined,
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
        reviewText,
        setReviewText,
        loading,
        estimatedDays,
        estimatedRent,
        handleSchedule,
        // New Address Props
        useSameAddress,
        setUseSameAddress: handleSetUseSameAddress,
        pickupZone,
        setPickupZone,
        phone,
        setPhone,
        landmark,
        setLandmark,
        roomNo,
        setRoomNo,
        yearOfStudy,
        setYearOfStudy,
        department,
        setDepartment,
        rollNo,
        setRollNo,
        area,
        setArea,
        latitude,
        setLatitude,
        longitude,
        setLongitude,
        formattedAddress,
        setFormattedAddress,
    };
}
