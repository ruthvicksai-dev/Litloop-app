import Button from "@/components/ui/core/Button";
import ConfirmActionModal from "@/components/ui/feedback/ConfirmActionModal";
import InputField from "@/components/ui/core/InputField";
import LoadingOverlay from "@/components/ui/feedback/LoadingOverlay";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { triggerHaptic } from "@/utils/haptics";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { router as globalRouter, useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
    const router = useRouter();
    const { user, accessToken, signOut } = useAuth();
    const { showToast } = useToast();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    const updatePushToken = useMutation(api.notifications.updatePushToken);
    const clearPushToken = useMutation(api.notifications.clearPushToken);
    const deleteAccountMutation = useMutation(api.users.deleteAccount);

    const handleTogglePush = async (value: boolean) => {
        if (!accessToken) return;

        triggerHaptic("light");
        if (value) {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== "granted") {
                showToast("Push notification permissions denied by system.", "error");
                return;
            }
            try {
                const projectId =
                    Constants.expoConfig?.extra?.eas?.projectId ??
                    Constants.easConfig?.projectId;
                if (!projectId) return;
                const { data: pushToken } = await Notifications.getExpoPushTokenAsync({
                    projectId,
                });
                await updatePushToken({ accessToken, pushToken });
                showToast("Push notifications enabled.", "success");
            } catch (e) {
                console.warn("[Settings] Failed to get push token", e);
                showToast("Failed to enable push notifications.", "error");
            }
        } else if (user?.pushToken) {
            await clearPushToken({ accessToken, pushToken: user.pushToken });
            showToast("Push notifications disabled.", "info");
        }
    };

    React.useEffect(() => {
        if (user === null && accessToken === null) {
            if (globalRouter.canDismiss()) {
                globalRouter.dismissAll();
            }
            globalRouter.replace("/(auth)/sign-in");
        }
    }, [user, accessToken]);

    const handleSignOut = async () => {
        setShowLogoutConfirm(false);
        setIsSigningOut(true);
        await signOut();
        setIsSigningOut(false);
        showToast("Signed out successfully.", "info");
    };

    const handleDeleteAccount = async () => {
        if (!accessToken) return;
        if (deleteConfirmText !== "DELETE") {
            showToast("Please type DELETE to confirm.", "error");
            return;
        }

        setIsDeletingAccount(true);
        try {
            await deleteAccountMutation({ accessToken, confirmText: deleteConfirmText });
            setShowDeleteModal(false);
            showToast("Your account has been permanently deleted.", "info");
            await signOut();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Failed to delete account.";
            showToast(message, "error");
        } finally {
            setIsDeletingAccount(false);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>
                    Settings
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => {
                            triggerHaptic("light");
                            router.push("/profile/edit");
                        }}
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: `${Colors.primary}15` },
                            ]}
                        >
                            <Ionicons
                                name="person-outline"
                                size={18}
                                color={Colors.primary}
                            />
                        </View>
                        <Text style={styles.rowText} allowFontScaling={false}>
                            Edit Profile
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={Colors.textLight}
                            style={styles.rowChevron}
                        />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => {
                            triggerHaptic("light");
                            router.push("/profile/change-password");
                        }}
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: `${Colors.primaryDark}15` },
                            ]}
                        >
                            <Ionicons
                                name="lock-closed-outline"
                                size={18}
                                color={Colors.primaryDark}
                            />
                        </View>
                        <Text style={styles.rowText} allowFontScaling={false}>
                            Change Password
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={Colors.textLight}
                            style={styles.rowChevron}
                        />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: `${Colors.primaryDark}15` },
                            ]}
                        >
                            <Ionicons
                                name="notifications-outline"
                                size={18}
                                color={Colors.primaryDark}
                            />
                        </View>
                        <Text style={styles.rowText} allowFontScaling={false}>
                            Push Notifications
                        </Text>
                        <View style={styles.rowTrailing}>
                            <Switch
                                value={!!user.pushToken}
                                onValueChange={handleTogglePush}
                                trackColor={{
                                    false: Colors.border,
                                    true: Colors.primary,
                                }}
                                thumbColor={Colors.white}
                            />
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => {
                            triggerHaptic("light");
                            router.push("/profile/support");
                        }}
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: `${Colors.textSecondary}15` },
                            ]}
                        >
                            <Ionicons
                                name="help-buoy-outline"
                                size={18}
                                color={Colors.primaryDark}
                            />
                        </View>
                        <Text style={styles.rowText} allowFontScaling={false}>
                            Contact Us
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={Colors.textLight}
                            style={styles.rowChevron}
                        />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => {
                            triggerHaptic("light");
                            router.push("/legal/privacy-policy" as any);
                        }}
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: `${Colors.primary}15` },
                            ]}
                        >
                            <Ionicons
                                name="shield-checkmark-outline"
                                size={18}
                                color={Colors.primary}
                            />
                        </View>
                        <Text style={styles.rowText} allowFontScaling={false}>
                            Privacy Policy
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={Colors.textLight}
                            style={styles.rowChevron}
                        />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => {
                            triggerHaptic("light");
                            router.push("/legal/terms-of-service" as any);
                        }}
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: `${Colors.textSecondary}15` },
                            ]}
                        >
                            <Ionicons
                                name="document-text-outline"
                                size={18}
                               color={Colors.primaryDark}
                            />
                        </View>
                        <Text style={styles.rowText} allowFontScaling={false}>
                            Terms of Service
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={Colors.textLight}
                            style={styles.rowChevron}
                        />
                    </TouchableOpacity>
                </View>

                <View style={[styles.section, styles.dangerSection]}>
                    <Text
                        style={[styles.sectionTitle, styles.dangerSectionTitle]}
                        allowFontScaling={false}
                    >
                        Danger Zone
                    </Text>
                    <View style={styles.formSection}>
                        <Text style={styles.dangerTitle}>Delete Account</Text>
                        <Text style={styles.formDescription}>
                            Permanently delete your Lit Loop account and all associated data.
                            This action cannot be undone.
                        </Text>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => {
                                triggerHaptic("medium");
                                setDeleteConfirmText("");
                                setShowDeleteModal(true);
                            }}
                        >
                            <Ionicons name="trash-outline" size={18} color={Colors.white} />
                            <Text style={styles.deleteButtonText}>Delete My Account</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.signOutBtn}
                    onPress={() => {
                        triggerHaptic("medium");
                        setShowLogoutConfirm(true);
                    }}
                >
                    <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                    <Text style={styles.signOutText} allowFontScaling={false}>
                        Sign Out
                    </Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText} allowFontScaling={false}>
                        LitLoop v{Constants.expoConfig?.version ?? "1.0.1"}
                    </Text>
                    <Text style={styles.footerText} allowFontScaling={false}>
                        © {new Date().getFullYear()} LitLoop. All rights reserved.
                    </Text>
                </View>
            </ScrollView>

            <ConfirmActionModal
                visible={showLogoutConfirm}
                title="Sign Out"
                message="Are you sure you want to securely log out of your account?"
                confirmLabel="Log Out"
                cancelLabel="Cancel"
                tone="danger"
                onCancel={() => setShowLogoutConfirm(false)}
                onConfirm={async () => {
                    setShowLogoutConfirm(false);
                    await handleSignOut();
                }}
            />

            <Modal
                visible={showDeleteModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDeleteModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Ionicons name="warning-outline" size={36} color={Colors.error} />
                        <Text style={styles.modalTitle}>Delete Account</Text>
                        <Text style={styles.modalBody}>
                            This will permanently delete your account, rental history, favorites,
                            and all data. This action{" "}
                            <Text style={styles.modalBodyBold}>cannot be undone</Text>.
                        </Text>
                        <Text style={styles.modalInstructions}>
                            Type <Text style={styles.deleteWord}>DELETE</Text> to confirm:
                        </Text>
                        <InputField
                            label=""
                            placeholder="Type DELETE here"
                            value={deleteConfirmText}
                            onChangeText={setDeleteConfirmText}
                            autoCapitalize="characters"
                            containerStyle={styles.deleteInput}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowDeleteModal(false)}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <Button
                                title="Delete Account"
                                onPress={handleDeleteAccount}
                                loading={isDeletingAccount}
                                containerStyle={styles.confirmDeleteButtonWrap}
                                style={styles.confirmDeleteButton}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            <LoadingOverlay visible={isSigningOut} />
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
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xl * 2,
    },
    section: {
        marginBottom: Spacing.xl,
        backgroundColor: Colors.white,
        borderRadius: 16,
        paddingVertical: Spacing.xs,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        paddingHorizontal: 16,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.xs,
    },
    row: {
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
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    rowChevron: {
        marginLeft: "auto",
    },
    rowTrailing: {
        marginLeft: "auto",
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
        backgroundColor: Colors.border + "60",
    },
    dangerSection: {
        borderColor: "#FCA5A5",
        backgroundColor: "#FFF5F5",
    },
    dangerSectionTitle: {
        color: Colors.error,
    },
    formSection: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    dangerTitle: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.error,
        marginTop: Spacing.xs,
        marginBottom: Spacing.xs,
    },
    formDescription: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        lineHeight: 22,
        marginBottom: Spacing.md,
    },
    deleteButton: {
        backgroundColor: Colors.error,
        borderRadius: Layout.cardRadius,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.xs,
    },
    deleteButtonText: {
        color: Colors.white,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.body,
    },
    signOutBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: `${Colors.error}15`,
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: Spacing.md,
        gap: 8,
    },
    signOutText: {
        color: Colors.error,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.body,
    },
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
        alignItems: "center",
        gap: Spacing.sm,
    },
    modalTitle: {
        fontSize: FontSizes.titleLarge,
        fontFamily: Fonts.bold,
        color: Colors.error,
    },
    modalBody: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        textAlign: "center",
        lineHeight: 22,
    },
    modalBodyBold: {
        fontFamily: Fonts.bold,
    },
    modalInstructions: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        textAlign: "center",
        width: "100%",
    },
    deleteWord: {
        fontFamily: Fonts.bold,
        color: Colors.error,
    },
    deleteInput: {
        width: "100%",
    },
    modalActions: {
        flexDirection: "row",
        gap: Spacing.sm,
        width: "100%",
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
    confirmDeleteButtonWrap: {
        flex: 1,
    },
    confirmDeleteButton: {
        backgroundColor: Colors.error,
    },
    footer: {
        marginTop: Spacing.xl,
        marginBottom: Spacing.md,
        alignItems: "center",
        gap: 4,
        opacity: 0.8,
    },
    footerText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        letterSpacing: 0.2,
    },
});
