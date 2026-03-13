import Button from "@/components/ui/Button";
import DatePickerField from "@/components/ui/DatePickerField";
import TimePickerField from "@/components/ui/TimePickerField";
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
import { Fonts, FontSizes } from "@/constants/fonts";

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxPickupDate = new Date(today);
    maxPickupDate.setDate(today.getDate() + 9);

    const minimumPickupDate = rental?.deliveryDate
        ? new Date(
              Math.max(
                  new Date(`${rental.deliveryDate}T00:00:00`).getTime() +
                      24 * 60 * 60 * 1000,
                  new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate()
                  ).getTime()
              )
          )
        : today;

    const pickupMaximumDate =
        minimumPickupDate.getTime() <= maxPickupDate.getTime()
            ? maxPickupDate
            : minimumPickupDate;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Schedule Return</Text>
                <Text style={styles.subtitle}>{rental?.book?.title || "Loading..."}</Text>

                {rental?.deliveryDate ? (
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Delivered on</Text>
                        <Text style={styles.infoValue}>{rental.deliveryDate}</Text>
                    </View>
                ) : null}

                <DatePickerField
                    label="Pickup Date"
                    placeholder="Select pickup date"
                    value={pickupDate}
                    minimumDate={minimumPickupDate}
                    maximumDate={pickupMaximumDate}
                    onChange={setPickupDate}
                />
                <TimePickerField
                    label="Pickup Time"
                    placeholder="Select pickup time"
                    value={pickupTime}
                    onChange={setPickupTime}
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
                            <Text style={styles.estimateValue}>₹{rental?.rentPerDay}/day</Text>
                        </View>
                        <View style={[styles.estimateRow, styles.totalRow]}>
                            <Text style={[styles.estimateLabel, styles.totalLabel]}>Total</Text>
                            <Text style={styles.totalValue}>₹{estimatedRent}</Text>
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
        fontSize: FontSizes.subtitle,
        color: Colors.primary,
        fontFamily: Fonts.medium,
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: FontSizes.heading,
        color: Colors.text,
        marginBottom: 4,
        fontFamily: Fonts.bold,
    },
    subtitle: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
        fontFamily: Fonts.regular,
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
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
    infoValue: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    estimateCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        marginTop: Spacing.md,
    },
    estimateTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    estimateRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    estimateLabel: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
    estimateValue: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: 8,
        marginTop: 4,
    },
    totalLabel: {
        fontFamily: Fonts.bold,
    },
    totalValue: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
});
