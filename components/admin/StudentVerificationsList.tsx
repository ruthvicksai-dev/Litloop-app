import Button from "@/components/ui/core/Button";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useVerifyStudentsScreen } from "@/hooks";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { FlatList, Image, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";

export default function StudentVerificationsList() {
    const { pendingVerifications, handleApprove, handleReject } = useVerifyStudentsScreen();
    const [refreshing, setRefreshing] = useState(false);

    // Reject Modal state
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejecting, setRejecting] = useState(false);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const openRejectModal = (targetId: string) => {
        setRejectTargetId(targetId);
        setRejectionReason("");
        setRejectModalVisible(true);
    };

    const confirmReject = async () => {
        if (!rejectTargetId) return;
        setRejecting(true);
        await handleReject(rejectTargetId, rejectionReason);
        setRejecting(false);
        setRejectModalVisible(false);
        setRejectTargetId(null);
    };

    if (pendingVerifications === undefined) {
        return (
            <View style={styles.center}>
                <Text style={styles.loadingText}>Loading verifications...</Text>
            </View>
        );
    }

    return (
        <>
            <FlatList
                data={pendingVerifications}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
                ListHeaderComponent={
                    <View style={styles.listHeaderWrap}>
                        <LinearGradient
                            colors={["#FFFFFF", "#E8F5E9", "#C8E6C9"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.overviewCard}
                        >
                            <View style={styles.overviewTop}>
                                <View style={styles.overviewBadgeRow}>
                                    <View style={[styles.overviewIconWrap, { backgroundColor: Colors.success + "20" }]}>
                                        <Ionicons name="school-outline" size={20} color={Colors.success} />
                                    </View>
                                    <Text style={[styles.overviewEyebrow, { color: Colors.success }]}>Student Verification</Text>
                                </View>
                                <Text style={styles.overviewTitle}>KITS College Zone</Text>
                                <Text style={styles.overviewSubtitle}>
                                    Review student ID cards to grant access to the College Zone.
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconWrap}>
                            <Ionicons name="checkmark-circle-outline" size={28} color={Colors.success} />
                        </View>
                        <Text style={styles.emptyTitle}>All students are verified</Text>
                        <Text style={styles.emptyText}>
                            There are no pending student verifications at the moment.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.requestCard}>
                        <View style={styles.requestHeader}>
                            <View style={styles.userInfoWrap}>
                                <Text style={styles.userName}>{item.fullNameOnId}</Text>
                                <Text style={styles.userEmail}>{item.studentIdNumber}</Text>
                            </View>
                            <View style={styles.dateWrap}>
                                <Text style={styles.dateText}>
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.metaRow}>
                            {item.department ? (
                                <View style={styles.metaPill}>
                                    <Ionicons name="business-outline" size={12} color={Colors.textSecondary} />
                                    <Text style={styles.metaPillText}>{item.department}</Text>
                                </View>
                            ) : null}
                            {item.year ? (
                                <View style={styles.metaPill}>
                                    <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
                                    <Text style={styles.metaPillText}>{item.year}</Text>
                                </View>
                            ) : null}
                        </View>

                        <View style={styles.proofRow}>
                            {item.idCardImageUrl ? (
                                <>
                                    <View style={styles.proofPreviewBadge}>
                                        <Ionicons name="image-outline" size={12} color={Colors.primary} />
                                        <Text style={styles.proofPreviewText}>ID Card Attached</Text>
                                    </View>
                                    <Image source={{ uri: item.idCardImageUrl }} style={styles.idScreenshot} />
                                </>
                            ) : (
                                <View style={styles.noProofCard}>
                                    <Ionicons name="alert-circle-outline" size={14} color={Colors.textLight} />
                                    <Text style={styles.noProofText}>Missing ID Card Image</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.actionRow}>
                            <View style={styles.actionButtonWrap}>
                                <Button
                                    title="Approve"
                                    onPress={() => handleApprove(item._id)}
                                    style={[styles.fullWidthButton, styles.compactActionButton, { backgroundColor: Colors.success }]}
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
                )}
            />

            <RejectModal
                visible={rejectModalVisible}
                reason={rejectionReason}
                setReason={setRejectionReason}
                loading={rejecting}
                onConfirm={confirmReject}
                onCancel={() => setRejectModalVisible(false)}
            />
        </>
    );
}

function RejectModal({ visible, reason, setReason, loading, onConfirm, onCancel }: any) {
    if (!visible) return null;
    return (
        <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Reject Verification</Text>
                <Text style={styles.modalSubtitle}>
                    Provide a reason so the user knows what to fix.
                </Text>
                <TextInput
                    style={styles.modalInput}
                    placeholder="e.g., ID is blurry, Name does not match"
                    placeholderTextColor={Colors.textLight}
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={3}
                />
                <View style={styles.modalActions}>
                    <Button title="Cancel" onPress={onCancel} variant="outline" style={{ flex: 1 }} />
                    <Button title="Reject" onPress={onConfirm} loading={loading} style={{ flex: 1, backgroundColor: Colors.error }} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 50,
    },
    loadingText: {
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    list: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    listHeaderWrap: {
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
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
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    overviewEyebrow: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    overviewTitle: {
        fontSize: FontSizes.titleLarge,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    overviewSubtitle: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        backgroundColor: Colors.white,
        borderRadius: 20,
        marginTop: 10,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    emptyIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.success + "15",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: Spacing.md,
    },
    emptyTitle: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 6,
    },
    emptyText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        textAlign: "center",
        paddingHorizontal: Spacing.lg,
    },
    requestCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    requestHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: Spacing.sm,
    },
    userInfoWrap: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    userName: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 2,
    },
    userEmail: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    dateWrap: {
        alignItems: "flex-end",
    },
    dateText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textLight,
    },
    metaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    metaPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    metaPillText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    proofRow: {
        backgroundColor: Colors.background,
        borderRadius: 16,
        padding: Spacing.sm,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    proofPreviewBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: Spacing.sm,
        paddingHorizontal: 4,
    },
    proofPreviewText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.primary,
        textTransform: "uppercase",
    },
    idScreenshot: {
        width: "100%",
        height: 200,
        borderRadius: 12,
        resizeMode: "cover",
    },
    noProofCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: Spacing.xl,
        gap: Spacing.sm,
    },
    noProofText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.textLight,
    },
    actionRow: {
        flexDirection: "row",
        gap: Spacing.md,
    },
    actionButtonWrap: {
        flex: 1,
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
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        alignItems: "center",
        padding: Spacing.lg,
        zIndex: 100,
    },
    modalCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: Spacing.lg,
        width: "100%",
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: Spacing.sm,
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        minHeight: 80,
        textAlignVertical: "top",
        marginBottom: Spacing.md,
    },
    modalActions: {
        flexDirection: "row",
        gap: Spacing.md,
    },
});
