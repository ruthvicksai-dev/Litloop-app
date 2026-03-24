import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";

export function usePaymentScreen(rentalId: string) {
    const { accessToken } = useAuth();
    const rental = useQuery(
        api.rentals.getRental,
        accessToken ? { accessToken, rentalId: rentalId as Id<"rentals"> } : "skip"
    );
    const { showToast } = useToast();
    const router = useRouter();

    const submitUpiPayment = useMutation(api.payments.submitUpiPayment);
    const selectCashPayment = useMutation(api.payments.selectCashPayment);
    const generateUploadUrl = useMutation(api.payments.generateUploadUrl);

    const [utrNumber, setUtrNumber] = useState("");
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash" | null>(
        null
    );

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setScreenshot(result.assets[0].uri);
        }
    };

    const handleUpiPayment = async () => {
        if (!utrNumber.trim()) {
            showToast("UTR number is required.", "error");
            return;
        }
        if (!screenshot) {
            showToast("Payment screenshot is required.", "error");
            return;
        }

        setUploading(true);
        try {
            if (!accessToken) throw new Error("Unauthenticated");
            const uploadUrl = await generateUploadUrl({ accessToken });
            const response = await fetch(screenshot);
            const blob = await response.blob();
            const uploadResult = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": blob.type || "image/jpeg" },
                body: blob,
            });
            const { storageId } = await uploadResult.json();

            await submitUpiPayment({
                accessToken,
                rentalId: rentalId as Id<"rentals">,
                utrNumber,
                paymentScreenshot: storageId,
            });

            showToast("Payment submitted for verification!", "success");
            router.replace("/(tabs)/my-rentals");
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Payment submission failed.";
            showToast(message, "error");
        } finally {
            setUploading(false);
        }
    };

    const handleCashPayment = async () => {
        setUploading(true);
        try {
            if (!accessToken) throw new Error("Unauthenticated");
            await selectCashPayment({
                accessToken,
                rentalId: rentalId as Id<"rentals">,
            });
            showToast("Cash on pickup selected. Pay on pickup day.", "success");
            router.replace("/(tabs)/my-rentals");
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to select cash payment.";
            showToast(message, "error");
        } finally {
            setUploading(false);
        }
    };

    return {
        rental,
        utrNumber,
        setUtrNumber,
        screenshot,
        uploading,
        paymentMethod,
        setPaymentMethod,
        pickImage,
        handleUpiPayment,
        handleCashPayment,
    };
}
