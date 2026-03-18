import BookLoader from "@/components/ui/BookLoader";
import Button from "@/components/ui/Button";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useVerifyPaymentScreen } from "@/hooks";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
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
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>

                    <Text style={styles.title}>Verify Payment</Text>

                    <View style={styles.detailCard}>
                        <Text style={styles.detailTitle}>{singleRental.book?.title}</Text>
                        <Text style={styles.detailSub}>
                            User: {singleRental.user?.name} • {singleRental.user?.phone}
                        </Text>
                        <Text style={styles.detailSub}>
                            Method: {singleRental.paymentMethod?.toUpperCase()}
                        </Text>
                        {singleRental.utrNumber ? (
                            <Text style={styles.detailSub}>UTR: {singleRental.utrNumber}</Text>
                        ) : null}
                        <Text style={styles.detailSub}>Amount: ₹{singleRental.totalRent}</Text>
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
                <BookLoader label="Loading payments..." />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primary} />
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
                                    {item.user?.name} • {item.paymentMethod?.toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.paymentAmount}>₹{item.totalRent}</Text>
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
                                <Ionicons
                                    name="checkmark"
                                    size={16}
                                    color={Colors.white}
                                    style={{ marginRight: 4 }}
                                />
                                <Text style={styles.approveBtnText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.rejectBtn}
                                onPress={() => handleVerify(item._id, false)}
                            >
                                <Ionicons
                                    name="close"
                                    size={16}
                                    color={Colors.error}
                                    style={{ marginRight: 4 }}
                                />
                                <Text style={styles.rejectBtnText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons
                            name="checkmark-circle-outline"
                            size={48}
                            color={Colors.textLight}
                            style={{ marginBottom: Spacing.md }}
                        />
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
    backBtn: {
        marginBottom: Spacing.sm,
        alignSelf: "flex-start",
        padding: 4,
        marginLeft: -4,
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
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
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
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 4,
    },
    detailSub: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        marginTop: 2,
        fontFamily: Fonts.regular,
    },
    screenshotCard: {
        marginBottom: Spacing.md,
    },
    screenshotLabel: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
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
        fontSize: FontSizes.bodyLarge,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    paymentSub: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        marginTop: 2,
        fontFamily: Fonts.regular,
    },
    paymentAmount: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    paymentUtr: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        marginTop: 6,
        fontFamily: Fonts.regular,
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
        flexDirection: "row",
        justifyContent: "center",
    },
    approveBtnText: {
        color: Colors.white,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.body,
    },
    rejectBtn: {
        flex: 1,
        backgroundColor: Colors.white,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: Colors.error,
    },
    rejectBtnText: {
        color: Colors.error,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.body,
    },
    empty: {
        alignItems: "center",
        paddingTop: 60,
    },
    emptyIcon: {
        fontSize: FontSizes.display,
        marginBottom: Spacing.md,
    },
    emptyText: {
        fontSize: FontSizes.subtitle,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
});
