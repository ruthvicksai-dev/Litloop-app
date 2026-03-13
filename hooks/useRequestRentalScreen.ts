import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";

export function useRequestRentalScreen(bookId: string) {
    const book = useQuery(api.books.get, {
        bookId: bookId as Id<"books">,
    });
    const { userId } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const requestRental = useMutation(api.rentals.requestRental);

    const [zone, setZone] = useState("");
    const [area, setArea] = useState("");
    const [city, setCity] = useState("");
    const [landmark, setLandmark] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRequest = async () => {
        if (!zone) {
            showToast("Please select a zone.", "error");
            return;
        }
        if (!area.trim()) {
            showToast("Area/Hostel/Apartment is required.", "error");
            return;
        }
        if (!city.trim()) {
            showToast("City is required.", "error");
            return;
        }
        if (!phone.trim()) {
            showToast("Phone number is required.", "error");
            return;
        }

        setLoading(true);
        try {
            await requestRental({
                userId: userId as Id<"users">,
                bookId: bookId as Id<"books">,
                zone,
                deliveryLocation: { area, city, landmark, phone },
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
        area,
        setArea,
        city,
        setCity,
        landmark,
        setLandmark,
        phone,
        setPhone,
        loading,
        handleRequest,
    };
}
