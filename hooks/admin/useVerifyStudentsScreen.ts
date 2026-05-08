import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

export function useVerifyStudentsScreen() {
    const { accessToken } = useAuth();
    const { showToast } = useToast();

    const approveVerification = useMutation(api.verifications.approveVerification);
    const rejectVerification = useMutation(api.verifications.rejectVerification);

    const pendingVerifications = useQuery(
        api.verifications.getPendingVerifications,
        accessToken ? { accessToken } : "skip"
    );

    const verificationHistory = useQuery(
        api.verifications.getVerificationHistory,
        accessToken ? { accessToken } : "skip"
    );

    const handleApprove = async (verificationId: string) => {
        try {
            if (!accessToken) throw new Error("Unauthenticated");
            await approveVerification({
                accessToken,
                verificationId: verificationId as Id<"student_verifications">,
            });
            showToast("Student verified successfully!", "success");
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to approve verification.";
            showToast(message, "error");
        }
    };

    const handleReject = async (verificationId: string, reason?: string) => {
        try {
            if (!accessToken) throw new Error("Unauthenticated");
            await rejectVerification({
                accessToken,
                verificationId: verificationId as Id<"student_verifications">,
                rejectionReason: reason?.trim() || undefined,
            });
            showToast("Verification rejected.", "error");
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to reject verification.";
            showToast(message, "error");
        }
    };

    return {
        pendingVerifications,
        verificationHistory,
        handleApprove,
        handleReject,
    };
}
