import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/ui/core/Button";
import { formatCurrency, getBookCoverUri } from "@/utils";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";
import { Fonts, FontSizes } from "@/constants/fonts";

type PaymentVerificationCardProps = {
    item: any;
    handleVerify: (id: string, approve: boolean) => void;
    openRejectModal: (id: string) => void;
    setSelectedImage: (url: string) => void;
};

export default function PaymentVerificationCard({
    item,
    handleVerify,
    openRejectModal,
    setSelectedImage,
}: PaymentVerificationCardProps) {
    const coverUri = getBookCoverUri(item);
    const paymentMethod = item.paymentMethod?.toUpperCase() || "N/A";
    const isCashPayment = item.paymentMethod === "cash";

    return (
        <View style={styles.paymentCard}>
            <View style={styles.paymentCardTop}>
                <View style={styles.paymentCardIdentity}>
                    {coverUri ? (
                        <ExpoImage source={{ uri: coverUri }} style={styles.paymentCover} cachePolicy="disk" />
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
                            {item.user?.name || "Unknown"}
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
                item.screenshotUrl ? (
                    <TouchableOpacity 
                        style={styles.imageAttachmentCard}
                        onPress={() => setSelectedImage(item.screenshotUrl!)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.attachmentIconWrap}>
                            <Ionicons name="image" size={20} color={Colors.primary} />
                        </View>
                        <View style={styles.attachmentTextWrap}>
                            <Text style={styles.attachmentTitle}>Payment Proof</Text>
                            <Text style={styles.attachmentSub}>Tap to view full screen</Text>
                        </View>
                        <Image source={{ uri: item.screenshotUrl }} style={styles.attachmentThumb} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.proofRow}>
                        <View style={styles.noProofCard}>
                            <Ionicons name="image-outline" size={14} color={Colors.textLight} />
                            <Text style={styles.noProofText}>Proof not uploaded yet</Text>
                        </View>
                    </View>
                )
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
                        onPress={() => openRejectModal(item._id)}
                        variant="outline"
                        style={[styles.fullWidthButton, styles.compactActionButton]}
                        textStyle={styles.compactActionButtonText}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    paymentCard: {
        backgroundColor: Colors.white,
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    paymentCardTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: Spacing.sm,
    },
    paymentCardIdentity: {
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: Spacing.md,
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
    noProofText: {
        fontSize: FontSizes.caption,
        color: Colors.textLight,
        fontFamily: Fonts.medium,
    },
    imageAttachmentCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.sm,
        marginBottom: Spacing.md,
        marginTop: Spacing.sm,
    },
    attachmentIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: Colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
        marginRight: Spacing.sm,
    },
    attachmentTextWrap: {
        flex: 1,
    },
    attachmentTitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
        marginBottom: 2,
    },
    attachmentSub: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
    },
    attachmentThumb: {
        width: 44,
        height: 44,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    actionRow: {
        flexDirection: "row",
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    actionButtonWrap: {
        flex: 1,
        minWidth: 0,
    },
    fullWidthButton: {
        width: "100%",
    },
    compactActionButton: {
        height: 40,
    },
    compactActionButtonText: {
        fontSize: FontSizes.small,
    },
});
