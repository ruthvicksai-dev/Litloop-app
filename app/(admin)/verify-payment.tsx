import Button from "@/components/ui/Button";
import { Colors, Spacing } from "@/constants/theme";
import { useVerifyPaymentScreen } from "@/hooks/useVerifyPaymentScreen";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyPaymentScreen() {
    const params = useLocalSearchParams<{ rentalId?: string }>();
    const router = useRouter();
    const { pendingPayments, singleRental, handleVerify } = useVerifyPaymentScreen(
        params.rentalId
    );

    if (params.rentalId && singleRental) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.scroll}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backText}>â† Back</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>Verify Payment</Text>

                    <View style={styles.detailCard}>
                        <Text style={styles.detailTitle}>{singleRental.book?.title}</Text>
                        <Text style={styles.detailSub}>
                            User: {singleRental.user?.name} â€¢ {singleRental.user?.phone}
                        </Text>
                        <Text style={styles.detailSub}>
                            Method: {singleRental.paymentMethod?.toUpperCase()}
                        </Text>
                        {singleRental.utrNumber ? (
                            <Text style={styles.detailSub}>UTR: {singleRental.utrNumber}</Text>
                        ) : null}
                        <Text style={styles.detailSub}>Amount: â‚¹{singleRental.totalRent}</Text>
                    </View>

                    {singleRental.screenshotUrl ? (
                        <View style={styles.screenshotCard}>
                            <Text style={styles.screenshotLabel}>Payment Screenshot</Text>
                            <Image
                                source={{ uri: singleRental.screenshotUrl }}
                                style={styles.screenshot}
                            />
                        </View>
                    ) : null}

                    <View style={styles.actionRow}>
                        <Button
                            title="Approve"
                            onPress={() => handleVerify(singleRental._id, true)}
                            style={{ flex: 1 }}
                        />
                        <Button
                            title="Reject"
                            onPress={() => handleVerify(singleRental._id, false)}
                            variant="outline"
                            style={{ flex: 1 }}
                        />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    if (pendingPayments === undefined) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>â† Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Pending Payments</Text>
                <Text style={styles.subtitle}>
                    {pendingPayments.length} payment{pendingPayments.length !== 1 ? "s" : ""} to
                    verify
                </Text>
            </View>

            <FlatList
                data={pendingPayments}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <View style={styles.paymentCard}>
                        <View style={styles.paymentHeader}>
                            <View style={styles.paymentHeaderInfo}>
                                <Text style={styles.paymentTitle}>{item.book?.title}</Text>
                                <Text style={styles.paymentSub}>
                                    {item.user?.name} â€¢ {item.paymentMethod?.toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.paymentAmount}>â‚¹{item.totalRent}</Text>
                        </View>

                        {item.utrNumber ? (
                            <Text style={styles.paymentUtr}>UTR: {item.utrNumber}</Text>
                        ) : null}

                        {item.screenshotUrl ? (
                            <Image
                                source={{ uri: item.screenshotUrl }}
                                style={styles.paymentScreenshot}
                            />
                        ) : null}

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.approveBtn}
                                onPress={() => handleVerify(item._id, true)}
                            >
                                <Text style={styles.approveBtnText}>âœ“ Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.rejectBtn}
                                onPress={() => handleVerify(item._id, false)}
                            >
                                <Text style={styles.rejectBtnText}>âœ• Reject</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>âœ…</Text>
                        <Text style={styles.emptyText}>No payments pending verification</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
    scroll: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
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
        fontSize: 13,
        color: Colors.textSecondary,
    },
    list: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 20,
    },
    detailCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    detailTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: Colors.text,
        marginBottom: 4,
    },
    detailSub: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    screenshotCard: {
        marginBottom: Spacing.md,
    },
    screenshotLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    screenshot: {
        width: "100%",
        height: 300,
        borderRadius: 12,
        resizeMode: "contain",
        backgroundColor: Colors.white,
    },
    actionRow: {
        flexDirection: "row",
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    paymentCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    paymentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    paymentHeaderInfo: {
        flex: 1,
    },
    paymentTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: Colors.text,
    },
    paymentSub: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    paymentAmount: {
        fontSize: 18,
        fontWeight: "700",
        color: Colors.primary,
    },
    paymentUtr: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 6,
    },
    paymentScreenshot: {
        width: "100%",
        height: 150,
        borderRadius: 8,
        marginTop: Spacing.sm,
        resizeMode: "cover",
    },
    approveBtn: {
        flex: 1,
        backgroundColor: Colors.success,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    approveBtnText: {
        color: Colors.white,
        fontWeight: "600",
        fontSize: 14,
    },
    rejectBtn: {
        flex: 1,
        backgroundColor: Colors.white,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
        borderWidth: 1,
        borderColor: Colors.error,
    },
    rejectBtnText: {
        color: Colors.error,
        fontWeight: "600",
        fontSize: 14,
    },
    empty: {
        alignItems: "center",
        paddingTop: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: Spacing.md,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
});
