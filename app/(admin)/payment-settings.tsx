import { AdminSettingsSkeleton } from "@/components/ui/skeletons/SettingsSkeleton";
import Button from "@/components/ui/core/Button";
import ConfirmActionModal from "@/components/ui/feedback/ConfirmActionModal";
import InputField from "@/components/ui/core/InputField";
import { CommonSettingsSections } from "@/components/shared/CommonSettingsSections";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";
import { usePaymentSettings } from "@/hooks";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import AdminHeader from "@/components/admin/core/AdminHeader";
import React, { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentSettingsScreen() {
    const {
        allSettings,
        saving,
        handleAddUpiId,
        handleEditUpiId,
        handleToggleActive,
        handleRemove,
    } = usePaymentSettings();

    const [showAddModal, setShowAddModal] = useState(false);
    const [newUpiId, setNewUpiId] = useState("");
    const [newMerchantName, setNewMerchantName] = useState("");
    const [removeTarget, setRemoveTarget] = useState<string | null>(null);
    const [editTarget, setEditTarget] = useState<{ id: string; upiId: string; merchantName: string } | null>(null);
    const [menuTarget, setMenuTarget] = useState<string | null>(null);

    if (allSettings === undefined) {
        return (
            <SafeAreaView style={styles.container}>
                <AdminHeader title="Settings" />
                <AdminSettingsSkeleton />
            </SafeAreaView>
        );
    }

    const canAddMore = (allSettings?.length ?? 0) < 2;
    const allDeactivated =
        allSettings !== undefined &&
        allSettings.length > 0 &&
        allSettings.every((s) => !s.active);

    const onAddSubmit = async () => {
        await handleAddUpiId(newUpiId, newMerchantName);
        setShowAddModal(false);
        setNewUpiId("");
        setNewMerchantName("");
    };

    return (
        <SafeAreaView style={styles.container}>
            <AdminHeader title="Settings" />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                onScrollBeginDrag={() => menuTarget && setMenuTarget(null)}
                onTouchStart={() => menuTarget && setMenuTarget(null)}
            >
                {/* ─── UPI Payment Settings ─── */}
                <Text style={styles.sectionLabel}>PAYMENT CONFIGURATION</Text>

                {allDeactivated && (
                    <View style={styles.warningBanner}>
                        <Ionicons name="warning-outline" size={18} color={Colors.warning} />
                        <Text style={styles.warningText}>
                            All UPI IDs are deactivated. UPI payments are currently on hold for users.
                        </Text>
                    </View>
                )}

                <View style={styles.section}>
                    {allSettings && allSettings.length > 0 ? (
                        allSettings.map((setting, index) => (
                            <React.Fragment key={setting._id}>
                                {index > 0 && <View style={styles.divider} />}
                                <View style={styles.upiRow}>
                                    <View style={styles.upiLeft}>
                                        <View style={styles.upiIdLine}>
                                            <Text style={styles.upiIdText} numberOfLines={1}>
                                                {setting.upiId}
                                            </Text>
                                            {setting.active && (
                                                <View style={styles.activeBadge}>
                                                    <View style={styles.activeDot} />
                                                    <Text style={styles.activeBadgeText}>Active</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.merchantText}>{setting.merchantName}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.menuBtn}
                                        onPress={() => {
                                            triggerHaptic("light");
                                            setMenuTarget(menuTarget === setting._id ? null : setting._id);
                                        }}
                                    >
                                        <Ionicons name="ellipsis-vertical" size={18} color={Colors.textSecondary} />
                                    </TouchableOpacity>

                                </View>
                            </React.Fragment>
                        ))
                    ) : (
                        <View style={styles.settingsRow}>
                            <View style={[styles.iconContainer, { backgroundColor: `${Colors.textSecondary}15` }]}>
                                <Ionicons name="card-outline" size={18} color={Colors.textSecondary} />
                            </View>
                            <Text style={[styles.rowText, { color: Colors.textSecondary }]}>
                                No UPI IDs configured
                            </Text>
                        </View>
                    )}

                    {canAddMore && (
                        <>
                            <View style={styles.divider} />
                            <TouchableOpacity
                                style={styles.settingsRow}
                                onPress={() => {
                                    triggerHaptic("light");
                                    setNewUpiId("");
                                    setNewMerchantName("");
                                    setShowAddModal(true);
                                }}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: `${Colors.primary}15` }]}>
                                    <Ionicons name="add" size={18} color={Colors.primary} />
                                </View>
                                <Text style={[styles.rowText, { color: Colors.primary }]} allowFontScaling={false}>
                                    Add UPI ID
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color={Colors.textLight} style={styles.rowChevron} />
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* ─── Shared: Notifications, Legal, Danger, Sign Out ─── */}
                <CommonSettingsSections />
            </ScrollView>

            {/* ─── Manage UPI Menu Modal ─── */}
            <Modal
                visible={!!menuTarget}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuTarget(null)}
            >
                <TouchableOpacity 
                    style={styles.menuModalOverlay}
                    activeOpacity={1}
                    onPress={() => setMenuTarget(null)}
                >
                    <View style={styles.menuModalCard}>
                        {(() => {
                            const setting = allSettings?.find((s) => s._id === menuTarget);
                            if (!setting) return null;
                            return (
                                <>
                                    <View style={styles.menuModalHeader}>
                                        <Text style={styles.menuModalTitle} numberOfLines={1}>{setting.upiId}</Text>
                                        <Text style={styles.menuModalSubtitle}>Manage Payment Method</Text>
                                    </View>
                                    
                                    <TouchableOpacity
                                        style={styles.menuModalItem}
                                        onPress={() => {
                                            setMenuTarget(null);
                                            triggerHaptic("light");
                                            handleToggleActive(setting._id as any);
                                        }}
                                    >
                                        <Ionicons
                                            name={setting.active ? "pause-circle-outline" : "checkmark-circle-outline"}
                                            size={20}
                                            color={setting.active ? Colors.error : Colors.success}
                                        />
                                        <Text style={[styles.menuModalItemText, setting.active && { color: Colors.error }]}>
                                            {setting.active ? "Deactivate" : "Activate"}
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    <View style={styles.menuDivider} />
                                    
                                    <TouchableOpacity
                                        style={styles.menuModalItem}
                                        onPress={() => {
                                            setMenuTarget(null);
                                            triggerHaptic("light");
                                            setEditTarget({
                                                id: setting._id,
                                                upiId: setting.upiId,
                                                merchantName: setting.merchantName,
                                            });
                                        }}
                                    >
                                        <Ionicons name="pencil-outline" size={20} color={Colors.primary} />
                                        <Text style={styles.menuModalItemText}>Edit Settings</Text>
                                    </TouchableOpacity>
                                    
                                    <View style={styles.menuDivider} />
                                    
                                    <TouchableOpacity
                                        style={styles.menuModalItem}
                                        onPress={() => {
                                            setMenuTarget(null);
                                            triggerHaptic("medium");
                                            setRemoveTarget(setting._id);
                                        }}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={Colors.error} />
                                        <Text style={[styles.menuModalItemText, { color: Colors.error }]}>Remove Method</Text>
                                    </TouchableOpacity>
                                </>
                            );
                        })()}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ─── Add UPI Modal ─── */}
            <Modal
                visible={showAddModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Add UPI ID</Text>
                        <Text style={styles.modalSubtitle}>
                            Add a UPI ID for receiving payments. You can have up to 2 IDs.
                        </Text>
                        <InputField
                            label="UPI ID"
                            placeholder="merchant@upi"
                            value={newUpiId}
                            onChangeText={setNewUpiId}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <InputField
                            label="Merchant Name"
                            placeholder="Lit Loop"
                            value={newMerchantName}
                            onChangeText={setNewMerchantName}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowAddModal(false)}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <Button
                                title="Add"
                                onPress={onAddSubmit}
                                loading={saving}
                                containerStyle={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ─── Edit UPI Modal ─── */}
            <Modal
                visible={!!editTarget}
                transparent
                animationType="fade"
                onRequestClose={() => setEditTarget(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Edit UPI ID</Text>
                        <InputField
                            label="UPI ID"
                            placeholder="merchant@upi"
                            value={editTarget?.upiId ?? ""}
                            onChangeText={(text) =>
                                setEditTarget((prev) => prev ? { ...prev, upiId: text } : null)
                            }
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <InputField
                            label="Merchant Name"
                            placeholder="Lit Loop"
                            value={editTarget?.merchantName ?? ""}
                            onChangeText={(text) =>
                                setEditTarget((prev) => prev ? { ...prev, merchantName: text } : null)
                            }
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setEditTarget(null)}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <Button
                                title="Save"
                                onPress={async () => {
                                    if (editTarget) {
                                        await handleEditUpiId(
                                            editTarget.id as any,
                                            editTarget.upiId,
                                            editTarget.merchantName
                                        );
                                        setEditTarget(null);
                                    }
                                }}
                                loading={saving}
                                containerStyle={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ─── Remove UPI Confirm ─── */}
            <ConfirmActionModal
                visible={!!removeTarget}
                title="Remove UPI ID?"
                message="This UPI ID will be removed from payment options. This cannot be undone."
                confirmLabel="Remove"
                cancelLabel="Cancel"
                tone="danger"
                onCancel={() => setRemoveTarget(null)}
                onConfirm={async () => {
                    if (removeTarget) await handleRemove(removeTarget as any);
                    setRemoveTarget(null);
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Layout.screenPaddingWide,
        paddingVertical: Spacing.sm,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: FontSizes.title,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.xl * 2,
    },

    // ─── Payment section (admin-only) ───
    sectionLabel: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
        paddingHorizontal: 4,
    },
    section: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
        overflow: "visible",
        zIndex: 10,
    },
    warningBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF8E1",
        borderWidth: 1,
        borderColor: "#FFE082",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 10,
        marginBottom: Spacing.sm,
    },
    warningText: {
        flex: 1,
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: "#F57C00",
        lineHeight: 18,
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
        backgroundColor: Colors.border + "60",
    },
    settingsRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    rowText: {
        flex: 1,
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    rowChevron: {
        marginLeft: "auto",
    },

    // ─── UPI card ───
    upiRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
    },
    upiLeft: {
        flex: 1,
        minWidth: 0,
    },
    upiIdLine: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    upiIdText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
        flexShrink: 1,
    },
    merchantText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    activeBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: `${Colors.success}08`,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
        gap: 5,
        borderWidth: 1,
        borderColor: `${Colors.success}25`,
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.success,
    },
    activeBadgeText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.medium,
        color: Colors.success,
    },
    menuBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    menuDivider: {
        height: 1,
        backgroundColor: Colors.border + "40",
    },
    menuModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "flex-end",
    },
    menuModalCard: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Spacing.xl * 2,
        paddingTop: Spacing.sm,
    },
    menuModalHeader: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border + "40",
        marginBottom: Spacing.xs,
    },
    menuModalTitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    menuModalSubtitle: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    menuModalItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
        gap: 12,
    },
    menuModalItemText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },

    // ─── Add UPI modal ───
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: Spacing.lg,
    },
    modalCard: {
        backgroundColor: Colors.white,
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.xl,
        width: "100%",
        gap: Spacing.sm,
    },
    modalTitle: {
        fontSize: FontSizes.titleLarge,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    modalSubtitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        lineHeight: scale(20),
    },
    modalActions: {
        flexDirection: "row",
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: Spacing.sm,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: Layout.cardRadius,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cancelText: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.body,
        color: Colors.text,
    },
});
