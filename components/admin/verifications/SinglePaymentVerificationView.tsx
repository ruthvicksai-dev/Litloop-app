import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/ui/core/Button";
import DetailRow from "@/components/admin/core/DetailRow";
import { formatCurrency, getBookCoverUri } from "@/utils";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";
import { Fonts, FontSizes } from "@/constants/fonts";

type SinglePaymentVerificationViewProps = {
    singleRental: any;
    handleVerify: (id: string, approve: boolean) => void;
    openRejectModal: (id: string) => void;
    setSelectedImage: (url: string) => void;
};

export default function SinglePaymentVerificationView({
    singleRental,
    handleVerify,
    openRejectModal,
    setSelectedImage,
}: SinglePaymentVerificationViewProps) {
    const coverUri = getBookCoverUri(singleRental);

    return (
        <>
            <LinearGradient
                colors={["#FFFDFC", "#F6E6CF", "#F1D8BF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
            >
                <View style={styles.heroTopRow}>
                    {coverUri ? (
                        <ExpoImage source={{ uri: coverUri }} style={styles.heroCover} cachePolicy="disk" />
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
                <TouchableOpacity 
                    style={styles.imageAttachmentCard}
                    onPress={() => setSelectedImage(singleRental.screenshotUrl!)}
                    activeOpacity={0.7}
                >
                    <View style={styles.attachmentIconWrap}>
                        <Ionicons name="image" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.attachmentTextWrap}>
                        <Text style={styles.attachmentTitle}>Payment Proof</Text>
                        <Text style={styles.attachmentSub}>Tap to view full screen</Text>
                    </View>
                    <Image source={{ uri: singleRental.screenshotUrl }} style={styles.attachmentThumb} />
                </TouchableOpacity>
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
                            onPress={() => openRejectModal(singleRental._id)}
                            variant="outline"
                            style={[styles.fullWidthButton, styles.compactActionButton]}
                            textStyle={styles.compactActionButtonText}
                        />
                    </View>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
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
    imageAttachmentCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.sm,
        marginBottom: Spacing.md,
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
