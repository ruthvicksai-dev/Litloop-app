import Button from "@/components/ui/core/Button";
import { Spacing } from "@/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

interface RentalActionButtonsProps {
    status: string;
    rentalId: string;
    onMarkDelivered: () => void;
    onMarkReturned: () => void;
}

export default function RentalActionButtons({
    status,
    rentalId,
    onMarkDelivered,
    onMarkReturned,
}: RentalActionButtonsProps) {
    const router = useRouter();

    return (
        <View style={styles.actionSection}>
            {status === "requested" && (
                <Button
                    title="Schedule Delivery"
                    onPress={() => router.push(`/(admin)/schedule-delivery?rentalId=${rentalId}`)}
                    variant="primary"
                />
            )}
            {status === "delivery_scheduled" && (
                <Button
                    title="Mark as Delivered"
                    onPress={onMarkDelivered}
                    variant="primary"
                />
            )}
            {status === "payment_pending" && (
                <Button
                    title="Verify Payment"
                    onPress={() => router.push(`/(admin)/verify-payment?rentalId=${rentalId}`)}
                    variant="primary"
                />
            )}
            {status === "paid" && (
                <Button
                    title="Mark as Returned"
                    onPress={onMarkReturned}
                    variant="primary"
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    actionSection: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
    },
});
