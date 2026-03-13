import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Colors, Spacing } from "@/constants/theme";
import { useScheduleReturnScreen } from "@/hooks/useScheduleReturnScreen";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScheduleReturnScreen() {
    const { rentalId } = useLocalSearchParams<{ rentalId: string }>();
    const router = useRouter();
    const {
        rental,
        pickupDate,
        setPickupDate,
        pickupTime,
        setPickupTime,
        loading,
        estimatedDays,
        estimatedRent,
        handleSchedule,
    } = useScheduleReturnScreen(rentalId);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>â† Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Schedule Return</Text>
                <Text style={styles.subtitle}>{rental?.book?.title || "Loading..."}</Text>

                {rental?.deliveryDate ? (
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Delivered on</Text>
                        <Text style={styles.infoValue}>{rental.deliveryDate}</Text>
                    </View>
                ) : null}

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

                {estimatedDays > 0 ? (
                    <View style={styles.estimateCard}>
                        <Text style={styles.estimateTitle}>Rent Estimate</Text>
                        <View style={styles.estimateRow}>
                            <Text style={styles.estimateLabel}>Days</Text>
                            <Text style={styles.estimateValue}>{estimatedDays}</Text>
                        </View>
                        <View style={styles.estimateRow}>
                            <Text style={styles.estimateLabel}>Rate</Text>
                            <Text style={styles.estimateValue}>â‚¹{rental?.rentPerDay}/day</Text>
                        </View>
                        <View
                            style={[
                                styles.estimateRow,
                                styles.totalRow,
                            ]}
                        >
                            <Text style={[styles.estimateLabel, styles.totalLabel]}>Total</Text>
                            <Text style={styles.totalValue}>â‚¹{estimatedRent}</Text>
                        </View>
                    </View>
                ) : null}

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
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: 8,
        marginTop: 4,
    },
    totalLabel: {
        fontWeight: "700",
    },
    totalValue: {
        fontSize: 18,
        fontWeight: "700",
        color: Colors.primary,
    },
});
