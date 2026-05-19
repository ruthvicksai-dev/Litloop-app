import {  Fonts } from "@/constants/fonts";
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
                                isCurrent && { backgroundColor: statusColor, borderColor: statusColor, transform: [{ scale: 1.2 }] },
                            ]}>
                                {isDone && !isCurrent && <Ionicons name="checkmark" size={10} color={Colors.white} />}
                                {isCurrent && <View style={styles.stepperDotInner} />}
                            </View>
                            {isCurrent && (
                                <Text style={styles.stepperLabel} numberOfLines={1}>
                                    {RENTAL_STATUS_LABELS[step as keyof typeof RENTAL_STATUS_LABELS]?.split(" ")[0]}
                                </Text>
                            )}
                        </View>
                        {i < STATUS_FLOW.length - 1 && (
                            <View style={[styles.stepperLine, i < currentIndex && { backgroundColor: Colors.success }]} />
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    stepperRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
    },
    stepperDotWrap: {
        alignItems: "center",
    },
    stepperDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
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
    stepperLabel: {
        fontSize: 9,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    stepperLine: {
        flex: 1,
        height: 2,
        backgroundColor: Colors.border,
        marginHorizontal: 2,
    },
});
