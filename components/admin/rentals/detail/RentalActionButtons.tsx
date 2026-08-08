import Button from "@/components/ui/core/Button";
import { triggerHaptic } from "@/utils";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

interface RentalActionButtonsProps {
    status: string;
    paymentStatus?: string;
    paymentMethod?: string;
    rentalId: string;
    onMarkDelivered: () => void;
    onMarkReturned: () => void;
    onVerifyCash?: () => void;
}

export default function RentalActionButtons({
    status,
    paymentStatus,
    paymentMethod,
    rentalId,
    onMarkDelivered,
    onMarkReturned,
    onVerifyCash,
}: RentalActionButtonsProps) {
    const router = useRouter();

    const isVisible = ["requested", "delivery_scheduled", "payment_pending", "paid", "pickup_scheduled"].includes(status);
    if (!isVisible) {
        return null;
    }

    return (
        <View style={styles.container}>
            {status === "requested" && (
                <Button
                    title="Schedule Delivery"
                    onPress={() => {
                        triggerHaptic("light");
                        router.push(`/(admin)/schedule-delivery?rentalId=${rentalId}`);
                    }}
                    variant="primary"
                />
            )}
            {status === "delivery_scheduled" && (
                <Button
                    title="Mark as Delivered"
                    onPress={() => {
                        triggerHaptic("light");
                        onMarkDelivered();
                    }}
                    variant="primary"
                />
            )}
            {(paymentStatus === "verification_pending" || (status === "payment_pending" && paymentMethod !== "cash")) && (
                <Button
                    title="Verify Payment (UPI)"
                    onPress={() => {
                        triggerHaptic("light");
                        router.push(`/(admin)/verify-payment?rentalId=${rentalId}`);
                    }}
                    variant="primary"
                    style={{ backgroundColor: "#8B5CF6" }}
                />
            )}
            {paymentStatus === "cash_pending" && onVerifyCash && (
                <Button
                    title="Verify Cash Payment (Mark Paid)"
                    onPress={() => {
                        triggerHaptic("light");
                        onVerifyCash();
                    }}
                    variant="primary"
                    style={{ backgroundColor: "#10B981" }}
                />
            )}
            {paymentStatus === "rejected" && (
                <Button
                    title="Review Payment Submission"
                    onPress={() => {
                        triggerHaptic("light");
                        router.push(`/(admin)/verify-payment?rentalId=${rentalId}`);
                    }}
                    variant="outline"
                />
            )}
            {status === "paid" && (
                <Button
                    title="Mark as Returned & Restock Book"
                    onPress={() => {
                        triggerHaptic("light");
                        onMarkReturned();
                    }}
                    variant="primary"
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 16,
    },
});
