import Button from "@/components/ui/core/Button";
import { Colors } from "@/constants/theme";
import { triggerHaptic } from "@/utils";
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

    if (!["requested", "delivery_scheduled", "payment_pending", "paid"].includes(status)) {
        return null;
    }

    return (
        <View style={styles.actionCard}>
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
            {status === "payment_pending" && (
                <Button
                    title="Verify Payment"
                    onPress={() => {
                        triggerHaptic("light");
                        router.push(`/(admin)/verify-payment?rentalId=${rentalId}`);
                    }}
                    variant="primary"
                />
            )}
            {status === "paid" && (
                <Button
                    title="Mark as Returned"
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
    actionCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        marginHorizontal: 16,
        marginTop: 4,
        marginBottom: 16,
        padding: 16,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
    },
});
