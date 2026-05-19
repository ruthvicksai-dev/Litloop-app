import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import SummaryStat from "@/components/admin/dashboard/SummaryStat";
import { Colors, Spacing, scale } from "@/constants/theme";
import { Fonts, FontSizes } from "@/constants/fonts";

type PaymentVerificationListHeaderProps = {
    pendingCount: number;
    screenshotCount: number;
};

export default function PaymentVerificationListHeader({
    pendingCount,
    screenshotCount,
}: PaymentVerificationListHeaderProps) {
    return (
        <View style={{ paddingBottom: Spacing.md }}>
            <LinearGradient
                colors={["#FFFFFF", "#E8F5E9", "#C8E6C9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.overviewCard}
            >
                <View style={styles.overviewTop}>
                    <View style={styles.overviewBadgeRow}>
                        <View style={[styles.overviewIconWrap, { backgroundColor: Colors.success + "20" }]}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.success} />
                        </View>
                        <Text style={[styles.overviewEyebrow, { color: Colors.success }]}>Admin review queue</Text>
                    </View>
                    <Text style={styles.overviewTitle}>Payment verification desk</Text>
                    <Text style={styles.overviewSubtitle}>
                        Keep approvals accurate and clear before moving rentals forward.
                    </Text>
                </View>

                <View style={styles.summaryRow}>
                    <SummaryStat
                        icon="time-outline"
                        label="Pending"
                        value={`${pendingCount}`}
                    />
                    <SummaryStat
                        icon="image-outline"
                        label="With Proof"
                        value={`${screenshotCount}`}
                    />
                    <SummaryStat
                        icon="card-outline"
                        label="Mode"
                        value="Manual"
                    />
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    overviewCard: {
        padding: Spacing.lg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
        marginBottom: Spacing.xs,
    },
    overviewTop: {
        gap: Spacing.sm,
    },
    overviewBadgeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    overviewIconWrap: {
        width: scale(36),
        height: scale(36),
        borderRadius: scale(12),
        backgroundColor: "rgba(255,255,255,0.72)",
        alignItems: "center",
        justifyContent: "center",
    },
    overviewEyebrow: {
        fontSize: FontSizes.caption,
        color: Colors.primary,
        fontFamily: Fonts.medium,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    overviewTitle: {
        fontSize: FontSizes.titleLarge,
        fontFamily: Fonts.bold,
        color: Colors.text,
        lineHeight: scale(26),
    },
    overviewSubtitle: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        lineHeight: scale(21),
    },
    summaryRow: {
        flexDirection: "row",
        gap: Spacing.sm,
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.05)",
    },
});
