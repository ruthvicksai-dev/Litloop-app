import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useRouter } from "expo-router";

/** Number of pending payments to load per page in the admin review screen. */
const PAGE_SIZE = 20;

export function useVerifyPaymentScreen(rentalId?: string) {
    const { showToast } = useToast();
    const router = useRouter();
    const { accessToken } = useAuth();
    const verifyPayment = useMutation(api.payments.verifyPayment);

    // M1: getPendingPayments is now paginated — use usePaginatedQuery so the
    // admin list loads in pages instead of potentially fetching everything.
    const {
        results: pendingPayments,
        status: pendingStatus,
        loadMore,
    } = usePaginatedQuery(
        api.payments.getPendingPayments,
        accessToken ? { accessToken } : "skip",
        { initialNumItems: PAGE_SIZE }
    );

    const singleRental = useQuery(
        api.rentals.getRental,
        accessToken && rentalId
            ? { accessToken, rentalId: rentalId as Id<"rentals"> }
            : "skip"
    );

    const handleVerify = async (
        targetRentalId: string,
        approved: boolean,
        rejectionReason?: string
    ) => {
        try {
            if (!accessToken) throw new Error("Unauthenticated");
            await verifyPayment({
                accessToken,
                rentalId: targetRentalId as Id<"rentals">,
                approved,
                rejectionReason: !approved ? rejectionReason?.trim() : undefined,
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
        pendingStatus,
        loadMore,
        singleRental,
        handleVerify,
    };
}
