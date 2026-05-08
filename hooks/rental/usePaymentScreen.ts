import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MAX_UPLOAD_SIZE_BYTES } from "@/utils";
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

    // Fetch backend-driven payment settings for dynamic QR/UPI config
    const paymentSettings = useQuery(api.paymentSettings.getActiveSettings);

    const { showToast } = useToast();
    const router = useRouter();

    const submitUpiPayment = useMutation(api.payments.submitUpiPayment);
    const selectCashPayment = useMutation(api.payments.selectCashPayment);
    const generateUploadUrl = useMutation(api.payments.generateUploadUrl);
    const cancelPickupMutation = useMutation(api.rentals.cancelPickup);

    const [utrNumber, setUtrNumber] = useState("");
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [canceling, setCanceling] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash" | null>(
        null
    );

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];

            // Client-side file size validation
            if (asset.fileSize && asset.fileSize > MAX_UPLOAD_SIZE_BYTES) {
                showToast("Image too large. Please select an image under 10 MB.", "error");
                return;
            }

            setScreenshot(asset.uri);
        }
    };

    const handleUpiPayment = async () => {
        // Normalize UTR to uppercase for consistent matching
        const normalizedUtr = utrNumber.trim().toUpperCase();

        if (!normalizedUtr) {
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
                utrNumber: normalizedUtr,
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

    const handleCancelPickup = async () => {
        setCanceling(true);
        try {
            if (!accessToken) throw new Error("Unauthenticated");
            await cancelPickupMutation({
                accessToken,
                rentalId: rentalId as Id<"rentals">,
            });
            showToast("Pickup cancelled. You can continue reading!", "success");
            router.replace("/(tabs)/my-rentals");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to cancel pickup.";
            showToast(message, "error");
        } finally {
            setCanceling(false);
        }
    };

    return {
        rental,
        paymentSettings,
        utrNumber,
        setUtrNumber,
        screenshot,
        uploading,
        paymentMethod,
        setPaymentMethod,
        pickImage,
        handleUpiPayment,
        handleCashPayment,
        canceling,
        handleCancelPickup,
    };
}
