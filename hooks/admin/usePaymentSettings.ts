import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

export function usePaymentSettings() {
    const { accessToken } = useAuth();
    const { showToast } = useToast();

    const allSettings = useQuery(
        api.paymentSettings.getAllSettings,
        accessToken ? { accessToken } : "skip"
    );

    const addUpiIdMutation = useMutation(api.paymentSettings.addUpiId);
    const updateUpiIdMutation = useMutation(api.paymentSettings.updateUpiId);
    const toggleActiveMutation = useMutation(api.paymentSettings.toggleActiveUpiId);
    const removeMutation = useMutation(api.paymentSettings.removeUpiId);

    const [saving, setSaving] = useState(false);

    const handleAddUpiId = async (upiId: string, merchantName: string) => {
        if (!accessToken) return;
        setSaving(true);
        try {
            await addUpiIdMutation({ accessToken, upiId, merchantName });
            showToast("UPI ID added!", "success");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to add UPI ID.";
            showToast(message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (settingId: Id<"payment_settings">) => {
        if (!accessToken) return;
        setSaving(true);
        try {
            await toggleActiveMutation({ accessToken, settingId });
            showToast("UPI ID updated!", "success");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to update.";
            showToast(message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (settingId: Id<"payment_settings">) => {
        if (!accessToken) return;
        setSaving(true);
        try {
            await removeMutation({ accessToken, settingId });
            showToast("UPI ID removed.", "info");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to remove.";
            showToast(message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleEditUpiId = async (
        settingId: Id<"payment_settings">,
        upiId: string,
        merchantName: string
    ) => {
        if (!accessToken) return;
        setSaving(true);
        try {
            await updateUpiIdMutation({ accessToken, settingId, upiId, merchantName });
            showToast("UPI ID updated!", "success");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to update UPI ID.";
            showToast(message, "error");
        } finally {
            setSaving(false);
        }
    };

    return {
        allSettings,
        saving,
        handleAddUpiId,
        handleEditUpiId,
        handleToggleActive,
        handleRemove,
    };
}
