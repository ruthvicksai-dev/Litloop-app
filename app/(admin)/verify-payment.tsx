import DetailRow from "@/components/admin/DetailRow";
import SummaryStat from "@/components/admin/SummaryStat";
import BookLoader from "@/components/ui/feedback/BookLoader";
import Button from "@/components/ui/core/Button";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";
import { useVerifyPaymentScreen } from "@/hooks";
import { formatCurrency, getBookCoverUri } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";



export default function VerifyPaymentScreen() {
    const params = useLocalSearchParams<{ rentalId?: string }>();
    const router = useRouter();
    const [refreshing, setRefreshing] = React.useState(false);
    const { pendingPayments, singleRental, handleVerify } = useVerifyPaymentScreen(
        params.rentalId
    );

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    if ((params.rentalId && singleRental === undefined) || pendingPayments === undefined) {
        return (
            <View style={styles.center}>
                <BookLoader label="Loading payments..." />
            </View>
        );
    }

    if (params.rentalId && !singleRental) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.screenHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Verify Payment</Text>
                        <Text style={styles.subtitle}>This payment request is no longer available.</Text>
                    </View>
                </View>
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconWrap}>
                        <Ionicons name="receipt-outline" size={26} color={Colors.textLight} />
                    </View>
                    <Text style={styles.emptyTitle}>Payment request not found</Text>
                    <Text style={styles.emptyText}>
                        It may have already been verified or removed from the queue.
                    </Text>
                    <Button title="Go Back" onPress={() => router.back()} style={styles.emptyButton} />
                </View>
            </SafeAreaView>
        );
    }

    if (params.rentalId && singleRental) {
        const coverUri = getBookCoverUri(singleRental);

        return (
            <SafeAreaView style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.singleScroll}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primary]}
                        />
                    }
                >
                    <View style={styles.screenHeader}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backBtn}
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                        >
                            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                        </TouchableOpacity>
                        <View style={styles.headerText}>
                            <Text style={styles.title}>Verify Payment</Text>
                            <Text style={styles.subtitle}>Review the payment proof before approving.</Text>
                        </View>
                    </View>

                    <LinearGradient
                        colors={["#FFFDFC", "#F6E6CF", "#F1D8BF"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroCard}
                    >
                        <View style={styles.heroTopRow}>
                            {coverUri ? (
                                <Image source={{ uri: coverUri }} style={styles.heroCover} />
                            ) : (
                                <View style={[styles.heroCover, styles.heroCoverPlaceholder]}>
                                    <Ionicons name="book-outline" size={24} color={Colors.primary} />
                                </View>
                            )}
                            <View style={styles.heroTextBlock}>
                                <Text style={styles.heroTitle}>{singleRental.book?.title || "Unknown"}</Text>
                                <Text style={styles.heroAuthor}>
                                    {singleRental.book?.author || "Unknown author"}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.heroMetaRow}>
                            <View style={styles.heroMetaChip}>
                                <Ionicons name="alert-circle-outline" size={14} color={Colors.warning} />
                                <Text style={styles.heroMetaText}>Pending verification</Text>
                            </View>
                            <View style={[styles.heroMetaChip, styles.heroAmountChip]}>
                                <Text style={styles.heroAmountText}>{formatCurrency(singleRental.totalRent)}</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    <View style={styles.infoCard}>
                        <Text style={styles.sectionTitle}>Payment details</Text>
                        <View style={styles.detailGrid}>
                            <DetailRow icon="person-outline" label="User" value={singleRental.user?.name} />
                            <DetailRow icon="call-outline" label="Phone" value={singleRental.user?.phone} />
                            <DetailRow
                                icon="card-outline"
                                label="Method"
                                value={singleRental.paymentMethod?.toUpperCase()}
                            />
                            <DetailRow
                                icon="cash-outline"
                                label="Amount"
                                value={formatCurrency(singleRental.totalRent)}
                                accent
                            />
                            <DetailRow icon="key-outline" label="UTR" value={singleRental.utrNumber} />
                        </View>
                    </View>

                    {singleRental.screenshotUrl ? (
                        <View style={styles.proofCard}>
                            <View style={styles.proofHeader}>
                                <View style={styles.proofIconWrap}>
                                    <Ionicons name="image-outline" size={18} color={Colors.primary} />
                                </View>
                                <View style={styles.proofHeaderText}>
                                    <Text style={styles.sectionTitle}>Payment proof</Text>
                                    <Text style={styles.sectionSubtitle}>
                                        Screenshot submitted by the user
                                    </Text>
                                </View>
                            </View>
                            <Image
                                source={{ uri: singleRental.screenshotUrl }}
                                style={styles.screenshot}
                            />
                        </View>
                    ) : null}

                    <View style={styles.reviewCard}>
                        <View style={styles.reviewHeader}>
                            <Text style={styles.sectionTitle}>Review action</Text>
                            <Text style={styles.sectionSubtitle}>
                                Approve only if the amount and proof match the request.
                            </Text>
                        </View>
                        <View style={styles.actionRow}>
                            <View style={styles.actionButtonWrap}>
                                <Button
                                    title="Approve"
                                    onPress={() => handleVerify(singleRental._id, true)}
                                    style={[styles.fullWidthButton, styles.compactActionButton]}
                                    textStyle={styles.compactActionButtonText}
                                />
                            </View>
                            <View style={styles.actionButtonWrap}>
                                <Button
                                    title="Reject"
                                    onPress={() => handleVerify(singleRental._id, false)}
                                    variant="outline"
                                    style={[styles.fullWidthButton, styles.compactActionButton]}
                                    textStyle={styles.compactActionButtonText}
                                />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    const screenshotCount = pendingPayments.filter((item) => !!item.screenshotUrl).length;

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={pendingPayments}
                keyExtractor={(item) => item._id}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.primary]}
                    />
                }
                renderItem={({ item }) => {
                    const coverUri = getBookCoverUri(item);
                    const paymentMethod = item.paymentMethod?.toUpperCase() || "N/A";
                    const isCashPayment = item.paymentMethod === "cash";

                    return (
                        <View style={styles.paymentCard}>
                            <LinearGradient
                                pointerEvents="none"
                                colors={["#FFFFFF", `${Colors.primary}0A`, Colors.primaryLight]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFillObject}
                            />

                            <View style={styles.paymentCardTop}>
                                <View style={styles.paymentCardIdentity}>
                                    {coverUri ? (
                                        <Image source={{ uri: coverUri }} style={styles.paymentCover} />
                                    ) : (
                                        <View style={[styles.paymentCover, styles.paymentCoverPlaceholder]}>
                                            <Ionicons name="book-outline" size={18} color={Colors.primary} />
                                        </View>
                                    )}
                                    <View style={styles.paymentTitleWrap}>
                                        <Text style={styles.paymentTitle} numberOfLines={1}>
                                            {item.book?.title || "Unknown"}
                                        </Text>
                                        <Text style={styles.paymentAuthor} numberOfLines={1}>
                                            {item.book?.author || "Unknown author"}
                                        </Text>
                                        <Text style={styles.paymentSub} numberOfLines={1}>
                                            {item.user?.name || "Unknown"} {"\u2022"} {paymentMethod}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.amountBadge}>
                                    <Text style={styles.paymentAmount}>{formatCurrency(item.totalRent)}</Text>
                                </View>
                            </View>

                            <View style={styles.cardMetaRow}>
                                <View style={styles.metaPill}>
                                    <Ionicons name="call-outline" size={12} color={Colors.textSecondary} />
                                    <Text style={styles.metaPillText}>{item.user?.phone || "No phone"}</Text>
                                </View>
                                {item.utrNumber ? (
                                    <View style={styles.metaPill}>
                                        <Ionicons name="key-outline" size={12} color={Colors.textSecondary} />
                                        <Text style={styles.metaPillText}>UTR: {item.utrNumber}</Text>
                                    </View>
                                ) : (
                                    <View style={styles.metaPill}>
                                        <Ionicons name="card-outline" size={12} color={Colors.textSecondary} />
                                        <Text style={styles.metaPillText}>{paymentMethod}</Text>
                                    </View>
                                )}
                            </View>

                            {item.screenshotUrl || !isCashPayment ? (
                                <View style={styles.proofRow}>
                                    {item.screenshotUrl ? (
                                        <>
                                            <View style={styles.proofPreviewBadge}>
                                                <Ionicons name="image-outline" size={12} color={Colors.primary} />
                                                <Text style={styles.proofPreviewText}>Screenshot attached</Text>
                                            </View>
                                            <Image
                                                source={{ uri: item.screenshotUrl }}
                                                style={styles.paymentScreenshot}
                                            />
                                        </>
                                    ) : (
                                        <View style={styles.noProofCard}>
                                            <Ionicons name="image-outline" size={14} color={Colors.textLight} />
                                            <Text style={styles.noProofText}>Proof not uploaded yet</Text>
                                        </View>
                                    )}
                                </View>
                            ) : null}

                            <View style={styles.actionRow}>
                                <View style={styles.actionButtonWrap}>
                                    <Button
                                        title="Approve"
                                        onPress={() => handleVerify(item._id, true)}
                                        style={[styles.fullWidthButton, styles.compactActionButton]}
                                        textStyle={styles.compactActionButtonText}
                                    />
                                </View>
                                <View style={styles.actionButtonWrap}>
                                    <Button
                                        title="Reject"
                                        onPress={() => handleVerify(item._id, false)}
                                        variant="outline"
                                        style={[styles.fullWidthButton, styles.compactActionButton]}
                                        textStyle={styles.compactActionButtonText}
                                    />
                                </View>
                            </View>
                        </View>
                    );
                }}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={styles.listHeaderWrap}>
                        <View style={styles.screenHeader}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                                <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                            </TouchableOpacity>
                            <View style={styles.headerText}>
                                <Text style={styles.title}>Pending Payments</Text>
                                <Text style={styles.subtitle}>
                                    Review incoming proofs and confirm them with confidence.
                                </Text>
                            </View>
                        </View>

                        <LinearGradient
                            colors={["#FFFFFF", "#F7EAD8", "#F2DDC8"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.overviewCard}
                        >
                            <View style={styles.overviewTop}>
                                <View style={styles.overviewBadgeRow}>
                                    <View style={styles.overviewIconWrap}>
                                        <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.overviewEyebrow}>Admin review queue</Text>
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
                                    value={`${pendingPayments.length}`}
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
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconWrap}>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={28}
                                color={Colors.success}
                            />
                        </View>
                        <Text style={styles.emptyTitle}>All payments are cleared</Text>
                        <Text style={styles.emptyText}>
                            There are no pending payment proofs waiting for admin verification.
                        </Text>
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
    singleScroll: {
        flexGrow: 1,
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl * 1.5,
    },
    list: {
        flexGrow: 1,
        paddingHorizontal: Layout.screenPaddingWide,
        paddingBottom: Spacing.xl,
    },
    listHeaderWrap: {
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    screenHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    backBtn: {
        width: Layout.touchSize,
        height: Layout.touchSize,
        alignItems: "center",
        justifyContent: "center",
    },
    headerText: {
        flex: 1,
        paddingTop: 3,
    },
    title: {
        fontSize: FontSizes.title,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    subtitle: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        marginTop: 4,
        lineHeight: scale(20),
    },
    heroCard: {
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: "rgba(117,64,67,0.10)",
        marginBottom: Spacing.md,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 3,
    },
    heroTopRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: Spacing.md,
    },
    heroCover: {
        width: scale(72),
        height: scale(104),
        borderRadius: scale(16),
        backgroundColor: Colors.white,
    },
    heroCoverPlaceholder: {
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(117,64,67,0.10)",
    },
    heroTextBlock: {
        flex: 1,
        justifyContent: "center",
    },
    heroTitle: {
        fontSize: FontSizes.body,
        color: Colors.text,
        fontFamily: Fonts.bold,
        lineHeight: scale(32),
    },
    heroAuthor: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        marginTop: 6,
        lineHeight: scale(20),
    },
    heroMetaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
        marginTop: Spacing.lg,
    },
    heroMetaChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(255,255,255,0.74)",
        borderRadius: 999,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    heroAmountChip: {
        marginLeft: "auto",
    },
    heroMetaText: {
        fontSize: FontSizes.body,
        color: Colors.text,
        fontFamily: Fonts.medium,
    },
    heroAmountText: {
        fontSize: FontSizes.title,
        color: Colors.primary,
        fontFamily: Fonts.bold,
    },
    infoCard: {
        backgroundColor: Colors.white,
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: "rgba(117,64,67,0.08)",
    },
    sectionTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    sectionSubtitle: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        marginTop: 4,
        lineHeight: scale(20),
    },
    detailGrid: {
        marginTop: Spacing.md,
        gap: Spacing.sm,
    },
    proofCard: {
        backgroundColor: Colors.white,
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: "rgba(117,64,67,0.08)",
    },
    proofHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    proofIconWrap: {
        width: scale(38),
        height: scale(38),
        borderRadius: scale(12),
        backgroundColor: Colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    proofHeaderText: {
        flex: 1,
    },
    screenshot: {
        width: "100%",
        aspectRatio: 1.22,
        borderRadius: Layout.borderRadius,
        resizeMode: "contain",
        backgroundColor: Colors.background,
    },
    reviewCard: {
        backgroundColor: Colors.white,
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: "rgba(117,64,67,0.08)",
    },
    reviewHeader: {
        marginBottom: Spacing.md,
    },
    actionRow: {
        flexDirection: "row",
        gap: Spacing.md,
        marginTop: Spacing.xs + 2,
    },
    actionButtonWrap: {
        flex: 1,
        minWidth: 0,
    },
    fullWidthButton: {
        width: "100%",
    },
    compactActionButton: {
        minHeight: scale(34),
        paddingVertical: scale(6),
        paddingHorizontal: Spacing.sm + 2,
    },
    compactActionButtonText: {
        fontSize: FontSizes.body,
    },
    overviewCard: {
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: "rgba(117,64,67,0.08)",
        marginBottom: Spacing.lg,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 3,
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
        gap: Spacing.xs,
        marginTop: Spacing.md,
    },

    paymentCard: {
        backgroundColor: Colors.white,
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.sm + 4,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: "rgba(117,64,67,0.08)",
        overflow: "hidden",
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    paymentCardTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    paymentCardIdentity: {
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: Spacing.sm,
        minWidth: 0,
    },
    paymentCover: {
        width: scale(46),
        height: scale(68),
        borderRadius: scale(10),
        backgroundColor: Colors.white,
    },
    paymentCoverPlaceholder: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.primaryLight,
    },
    paymentTitleWrap: {
        flex: 1,
        minWidth: 0,
    },
    paymentTitle: {
        fontSize: FontSizes.bodyLarge,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    paymentAuthor: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
    paymentSub: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        marginTop: 3,
        fontFamily: Fonts.medium,
    },
    amountBadge: {
        backgroundColor: Colors.white,
        borderRadius: 999,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderWidth: 1,
        borderColor: `${Colors.primary}18`,
        alignSelf: "center",
    },
    paymentAmount: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    cardMetaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    metaPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: Spacing.xs + 2,
        borderRadius: 999,
        backgroundColor: Colors.background,
        maxWidth: "100%",
    },
    metaPillText: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        flexShrink: 1,
    },
    proofRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    proofPreviewBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: Spacing.sm - 1,
        paddingVertical: Spacing.xs,
        borderRadius: 999,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: `${Colors.primary}18`,
        flexShrink: 1,
    },
    proofPreviewText: {
        fontSize: FontSizes.caption,
        color: Colors.primary,
        fontFamily: Fonts.medium,
    },
    paymentScreenshot: {
        width: scale(78),
        height: scale(56),
        borderRadius: scale(10),
        resizeMode: "cover",
        backgroundColor: Colors.background,
    },
    noProofCard: {
        flex: 1,
        borderRadius: Layout.borderRadius,
        paddingVertical: Spacing.xs + 4,
        paddingHorizontal: Spacing.sm + 2,
        backgroundColor: "rgba(255,255,255,0.72)",
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: Colors.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    cashProofCard: {
        backgroundColor: `${Colors.primary}0A`,
        borderStyle: "solid",
        borderColor: `${Colors.primary}20`,
    },
    noProofText: {
        fontSize: FontSizes.caption,
        color: Colors.textLight,
        fontFamily: Fonts.medium,
    },
    cashProofText: {
        fontSize: FontSizes.caption,
        color: Colors.primary,
        fontFamily: Fonts.medium,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xl * 2,
    },
    emptyIconWrap: {
        width: scale(68),
        height: scale(68),
        borderRadius: scale(22),
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.md,
    },
    emptyTitle: {
        fontSize: FontSizes.subtitle,
        color: Colors.text,
        fontFamily: Fonts.bold,
        textAlign: "center",
    },
    emptyText: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        textAlign: "center",
        lineHeight: scale(22),
        marginTop: Spacing.sm,
    },
    emptyButton: {
        marginTop: Spacing.lg,
        minWidth: scale(160),
    },
});
