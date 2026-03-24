import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getPhoneValidationError, normalizePhoneNumber } from "@/utils/phone";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";

export function useRequestRentalScreen(bookId: string) {
    const book = useQuery(api.books.get, {
        bookId: bookId as Id<"books">,
    });
    const { accessToken } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const requestRental = useMutation(api.rentals.requestRental);

    const [zone, setZone] = useState("");
    const [phone, setPhone] = useState("");
    const [landmark, setLandmark] = useState("");
    const [loading, setLoading] = useState(false);

    // College Specifics
    const [roomNo, setRoomNo] = useState("");
    const [yearOfStudy, setYearOfStudy] = useState("");
    const [department, setDepartment] = useState("");
    const [rollNo, setRollNo] = useState("");

    // Home Specifics
    const [latitude, setLatitude] = useState<number | undefined>();
    const [longitude, setLongitude] = useState<number | undefined>();
    const [formattedAddress, setFormattedAddress] = useState("");

    const handleRequest = async () => {
        if (!zone) {
            showToast("Please select a zone.", "error");
            return;
        }
        const phoneError = getPhoneValidationError(phone);
        if (phoneError) {
            showToast(phoneError, "error");
            return;
        }

        if (zone === "College") {
            if (!roomNo.trim()) {
                showToast("Room number is required for College delivery.", "error");
                return;
            }
            if (!rollNo.trim()) {
                showToast("Roll number is required for College delivery.", "error");
                return;
            }
        } else if (zone === "Home") {
            if (!formattedAddress.trim()) {
                showToast("Delivery address is required for Home delivery.", "error");
                return;
            }
        }

        const normalizedPhone = normalizePhoneNumber(phone);

        setLoading(true);
        try {
            if (!accessToken) throw new Error("Unauthenticated");
            await requestRental({
                accessToken,
                bookId: bookId as Id<"books">,
                zone,
                deliveryLocation: {
                    phone: normalizedPhone,
                    landmark,
                    roomNo,
                    yearOfStudy,
                    department,
                    rollNo,
                    latitude,
                    longitude,
                    formattedAddress,
                },
            });
            showToast("Book requested successfully!", "success");
            router.replace("/(tabs)/my-rentals");
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to request book.";
            showToast(message, "error");
        } finally {
            setLoading(false);
        }
    };

    return {
        book,
        zone,
        setZone,
        landmark,
        setLandmark,
        phone,
        setPhone,
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
        loading,
        handleRequest,
    };
}
