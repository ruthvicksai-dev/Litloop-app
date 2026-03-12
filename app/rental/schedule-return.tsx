import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Colors, Spacing } from "@/constants/theme";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScheduleReturnScreen() {
    const { rentalId } = useLocalSearchParams<{ rentalId: string }>();
    const rental = useQuery(api.rentals.getRental, {
        rentalId: rentalId as Id<"rentals">,
    });
    const { showToast } = useToast();
    const router = useRouter();
    const schedulePickup = useMutation(api.rentals.schedulePickup);

    const [pickupDate, setPickupDate] = useState("");
    const [pickupTime, setPickupTime] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSchedule = async () => {
        if (!pickupDate) {
            showToast("Pickup date is required.", "error");
            return;
        }
        if (!pickupTime) {
            showToast("Pickup time is required.", "error");
            return;
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(pickupDate)) {
            showToast("Date should be in YYYY-MM-DD format.", "error");
            return;
        }

        if (rental?.deliveryDate && new Date(pickupDate) <= new Date(rental.deliveryDate)) {
            showToast("Pickup date must be after delivery date.", "error");
            return;
        }

        setLoading(true);
        try {
            await schedulePickup({
                rentalId: rentalId as Id<"rentals">,
                pickupDate,
                pickupTime,
            });
            showToast("Pickup scheduled! Proceed to payment.", "success");
            router.replace(`/rental/payment?rentalId=${rentalId}`);
        } catch (error: any) {
            showToast(error.message || "Failed to schedule pickup.", "error");
        } finally {
            setLoading(false);
        }
    };

    const estimatedDays =
        rental?.deliveryDate && pickupDate
            ? Math.max(
                0,
                Math.ceil(
                    (new Date(pickupDate).getTime() -
                        new Date(rental.deliveryDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
            )
            : 0;

    const estimatedRent = estimatedDays * (rental?.rentPerDay || 0);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Schedule Return</Text>
                <Text style={styles.subtitle}>
                    {rental?.book?.title || "Loading..."}
                </Text>

                {rental?.deliveryDate && (
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Delivered on</Text>
                        <Text style={styles.infoValue}>{rental.deliveryDate}</Text>
                    </View>
                )}

                <InputField
                    label="Pickup Date"
                    placeholder="YYYY-MM-DD"
                    value={pickupDate}
                    onChangeText={setPickupDate}
                />
                <InputField
                    label="Pickup Time"
                    placeholder="e.g. 10:00 AM"
                    value={pickupTime}
                    onChangeText={setPickupTime}
                />

                {estimatedDays > 0 && (
                    <View style={styles.estimateCard}>
                        <Text style={styles.estimateTitle}>Rent Estimate</Text>
                        <View style={styles.estimateRow}>
                            <Text style={styles.estimateLabel}>Days</Text>
                            <Text style={styles.estimateValue}>{estimatedDays}</Text>
                        </View>
                        <View style={styles.estimateRow}>
                            <Text style={styles.estimateLabel}>Rate</Text>
                            <Text style={styles.estimateValue}>
                                ₹{rental?.rentPerDay}/day
                            </Text>
                        </View>
                        <View
                            style={[styles.estimateRow, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8, marginTop: 4 }]}
                        >
                            <Text style={[styles.estimateLabel, { fontWeight: "700" }]}>
                                Total
                            </Text>
                            <Text style={styles.totalValue}>₹{estimatedRent}</Text>
                        </View>
                    </View>
                )}

                <Button
                    title="Schedule Pickup"
                    onPress={handleSchedule}
                    loading={loading}
                    style={{ marginTop: Spacing.md }}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scroll: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    backText: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: "600",
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: Colors.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
    },
    infoCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: Spacing.lg,
    },
    infoLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.text,
    },
    estimateCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        marginTop: Spacing.md,
    },
    estimateTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    estimateRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    estimateLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    estimateValue: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.text,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: "700",
        color: Colors.primary,
    },
});
