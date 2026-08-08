import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, RENTAL_STATUS_LABELS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface RentalTimelineStepperProps {
    currentIndex: number;
    statusColor: string;
    customStepLabel?: string;
}

export const ENTERPRISE_STATUS_FLOW = [
    { key: "requested", label: "Requested" },
    { key: "delivery_scheduled", label: "Delivery" },
    { key: "delivered", label: "Reading" },
    { key: "pickup_scheduled", label: "Pickup" },
    { key: "paid", label: "Paid" },
    { key: "returned", label: "Returned" },
];

export default function RentalTimelineStepper({
    currentIndex,
    statusColor,
    customStepLabel,
}: RentalTimelineStepperProps) {
    const safeIndex = Math.max(0, Math.min(currentIndex, ENTERPRISE_STATUS_FLOW.length - 1));
    const activeLabel = customStepLabel || ENTERPRISE_STATUS_FLOW[safeIndex]?.label || "Processing";

    return (
        <View style={styles.stepperContainer}>
            <View style={styles.stepperRow}>
                {ENTERPRISE_STATUS_FLOW.map((step, i) => {
                    const isDone = i <= safeIndex;
                    const isCurrent = i === safeIndex;
                    return (
                        <React.Fragment key={step.key}>
                            <View style={styles.stepperDotWrap}>
                                <View style={[
                                    styles.stepperDot,
                                    isDone && { backgroundColor: Colors.success, borderColor: Colors.success },
                                    isCurrent && { backgroundColor: statusColor, borderColor: statusColor, transform: [{ scale: 1.15 }] },
                                ]}>
                                    {isDone && !isCurrent && <Ionicons name="checkmark" size={10} color={Colors.white} />}
                                    {isCurrent && <View style={styles.stepperDotInner} />}
                                </View>
                                <Text
                                    style={[
                                        styles.stepMiniLabel,
                                        isCurrent && { color: statusColor, fontFamily: Fonts.bold },
                                        isDone && !isCurrent && { color: Colors.text },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {step.label}
                                </Text>
                            </View>
                            {i < ENTERPRISE_STATUS_FLOW.length - 1 && (
                                <View style={[styles.stepperLine, i < safeIndex && { backgroundColor: Colors.success }]} />
                            )}
                        </React.Fragment>
                    );
                })}
            </View>
            <View style={styles.currentStepBadge}>
                <Text style={styles.currentStepLabel}>Current Stage:</Text>
                <Text style={[styles.currentStepValue, { color: statusColor }]}>
                    {activeLabel}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    stepperContainer: {
        marginTop: 4,
    },
    stepperRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 4,
        marginBottom: 8,
    },
    stepperDotWrap: {
        alignItems: "center",
    },
    stepperDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.border,
        borderWidth: 2,
        borderColor: Colors.border,
        justifyContent: "center",
        alignItems: "center",
    },
    stepperDotInner: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.white,
    },
    stepperLine: {
        flex: 1,
        height: 2.5,
        backgroundColor: Colors.border,
        marginHorizontal: 1,
    },
    currentStepBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "flex-start",
        marginTop: 4,
    },
    currentStepLabel: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    currentStepValue: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
    },
    stepMiniLabel: {
        fontSize: 9,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        marginTop: 4,
        textAlign: "center",
    },
});
