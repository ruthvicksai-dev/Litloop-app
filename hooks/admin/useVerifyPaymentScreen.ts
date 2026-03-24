import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";

export function useVerifyPaymentScreen(rentalId?: string) {
    const { showToast } = useToast();
    const router = useRouter();
    const { accessToken } = useAuth();
    const verifyPayment = useMutation(api.payments.verifyPayment);
    const pendingPayments = useQuery(
        api.payments.getPendingPayments,
        accessToken ? { accessToken } : "skip"
    );
    const singleRental = useQuery(
        api.rentals.getRental,
        accessToken && rentalId ? { accessToken, rentalId: rentalId as Id<"rentals"> } : "skip"
    );

    const handleVerify = async (targetRentalId: string, approved: boolean) => {
        try {
            if (!accessToken) throw new Error("Unauthenticated");
            await verifyPayment({
                accessToken,
                rentalId: targetRentalId as Id<"rentals">,
                approved,
            });
            showToast(
                approved ? "Payment approved!" : "Payment rejected.",
                approved ? "success" : "error"
            );

            if (approved && rentalId && rentalId === targetRentalId) {
                router.replace({
                    pathname: "/(admin)/rental/[id]",
                    params: { id: targetRentalId },
                } as any);
            }
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to verify payment.";
            showToast(message, "error");
        }
    };

    return {
        pendingPayments,
        singleRental,
        handleVerify,
    };
}
