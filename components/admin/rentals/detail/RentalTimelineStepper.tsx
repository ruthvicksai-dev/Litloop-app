import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, RENTAL_STATUS_LABELS, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface RentalTimelineStepperProps {
    currentIndex: number;
    statusColor: string;
}

const STATUS_FLOW = ["requested", "delivery_scheduled", "delivered", "payment_pending", "paid", "returned"];

export default function RentalTimelineStepper({ currentIndex, statusColor }: RentalTimelineStepperProps) {
    return (
        <View style={styles.stepperContainer}>
            <View style={styles.stepperRow}>
                {STATUS_FLOW.map((step, i) => {
                    const isDone = i <= currentIndex;
                    const isCurrent = i === currentIndex;
                    return (
                        <React.Fragment key={step}>
                            <View style={styles.stepperDotWrap}>
                                <View style={[
                                    styles.stepperDot,
                                    isDone && { backgroundColor: Colors.success, borderColor: Colors.success },
                                    isCurrent && { backgroundColor: statusColor, borderColor: statusColor, transform: [{ scale: 1.15 }] },
                                ]}>
                                    {isDone && !isCurrent && <Ionicons name="checkmark" size={10} color={Colors.white} />}
                                    {isCurrent && <View style={styles.stepperDotInner} />}
                                </View>
                            </View>
                            {i < STATUS_FLOW.length - 1 && (
                                <View style={[styles.stepperLine, i < currentIndex && { backgroundColor: Colors.success }]} />
                            )}
                        </React.Fragment>
                    );
                })}
            </View>
            <View style={styles.currentStepBadge}>
                <Text style={styles.currentStepLabel}>Current Step:</Text>
                <Text style={[styles.currentStepValue, { color: statusColor }]}>
                    {RENTAL_STATUS_LABELS[STATUS_FLOW[currentIndex] as keyof typeof RENTAL_STATUS_LABELS] || STATUS_FLOW[currentIndex]}
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
});
