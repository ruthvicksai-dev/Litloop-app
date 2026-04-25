import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import PasswordRequirements from "@/components/ui/PasswordRequirements";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, scale, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { getPhoneValidationError, normalizePhoneNumber } from "@/utils/phone";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, accessToken, isLoading, signOut } = useAuth();
    const { showToast } = useToast();
    const updateUserMutation = useMutation(api.users.updateUser);
    const changePasswordMutation = useMutation(api.auth.changePassword);
    const deleteAccountMutation = useMutation(api.users.deleteAccount);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/(auth)/sign-in");
        }
    }, [isLoading, router, user]);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setPhone(user.phone || "");
        }
    }, [user]);

    const handleSaveProfile = async () => {
        if (!accessToken) return;
        if (!name.trim() || !phone.trim()) {
            showToast("Name and phone cannot be empty.", "error");
            return;
        }

        const phoneError = getPhoneValidationError(phone);
        if (phoneError) {
            showToast(phoneError, "error");
            return;
        }

        setIsSavingProfile(true);
        try {
            await updateUserMutation({
                accessToken,
                name,
                phone: normalizePhoneNumber(phone),
            });
            showToast("Profile updated successfully.", "success");
            router.back();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Failed to update profile.";
            showToast(message, "error");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (!accessToken) return;
        if (!currentPassword) {
            showToast("Current password is required.", "error");
            return;
        }
        if (newPassword.length < 8) {
            showToast("New password must be at least 8 characters.", "error");
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast("Passwords do not match.", "error");
            return;
        }

        setIsSavingPassword(true);
        try {
            await changePasswordMutation({
                accessToken,
                currentPassword,
                newPassword,
            });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            showToast("Password updated successfully.", "success");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Failed to change password.";
            showToast(message, "error");
        } finally {
            setIsSavingPassword(false);
        }
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
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={scale(22)} color={Colors.primary} />
                        </TouchableOpacity>
                        <View style={styles.headerText}>
                            <Text style={styles.title}>Edit Profile</Text>
                            <Text style={styles.subtitle}>Update your details and password</Text>
                        </View>
                    </View>

                    {/* Profile Details */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Profile Details</Text>
                        <InputField
                            label="Full Name"
                            placeholder="Enter your name"
                            value={name}
                            onChangeText={setName}
                        />
                        <InputField
                            label="Email"
                            placeholder="Your email"
                            value={user.email}
                            editable={false}
                            inputStyle={styles.disabledInput}
                        />
                        <InputField
                            label="Phone Number"
                            placeholder="Enter your phone number"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                        <Button
                            title="Save Profile"
                            onPress={handleSaveProfile}
                            loading={isSavingProfile}
                            style={styles.sectionButton}
                        />
                    </View>

                    {/* Change Password */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Change Password</Text>
                        <Text style={styles.sectionDescription}>
                            Enter your current password to set a new one.
                        </Text>
                        <InputField
                            label="Current Password"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry
                        />
                        <InputField
                            label="New Password"
                            placeholder="Enter new password (min 8 chars)"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                        />
                        <PasswordRequirements password={newPassword} />
                        <InputField
                            label="Confirm New Password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                        <Button
                            title="Update Password"
                            onPress={handleChangePassword}
                            loading={isSavingPassword}
                            style={styles.sectionButton}
                        />
                    </View>

                    {/* Danger Zone — required for Google Play policy compliance */}
                    <View style={[styles.card, styles.dangerCard]}>
                        <Text style={styles.dangerTitle}>Danger Zone</Text>
                        <Text style={styles.sectionDescription}>
                            Permanently delete your Lit Loop account and all associated data.
                            This action cannot be undone.
                        </Text>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => {
                                setDeleteConfirmText("");
                                setShowDeleteModal(true);
                            }}
                        >
                            <Ionicons name="trash-outline" size={scale(16)} color="#fff" />
                            <Text style={styles.deleteButtonText}>Delete My Account</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={showDeleteModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDeleteModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Ionicons name="warning-outline" size={scale(36)} color="#DC2626" />
                        <Text style={styles.modalTitle}>Delete Account</Text>
                        <Text style={styles.modalBody}>
                            This will permanently delete your account, rental history, favorites,
                            and all data. This action{" "}
                            <Text style={{ fontFamily: Fonts.bold }}>cannot be undone</Text>.
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
                                style={styles.confirmDeleteButton}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    flex: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.xl * 1.5,
        gap: Spacing.lg,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        marginBottom: Spacing.xs,
    },
    backButton: {
        alignItems: "center",
        justifyContent: "center",
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: FontSizes.titleLarge,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    subtitle: {
        marginTop: Spacing.xs,
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    dangerCard: {
        borderColor: "#FCA5A5",
        backgroundColor: "#FFF5F5",
    },
    sectionTitle: {
        fontSize: FontSizes.title,
        color: Colors.text,
        fontFamily: Fonts.bold,
        marginBottom: Spacing.sm,
    },
    dangerTitle: {
        fontSize: FontSizes.title,
        color: "#DC2626",
        fontFamily: Fonts.bold,
        marginBottom: Spacing.sm,
    },
    sectionDescription: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        marginBottom: Spacing.md,
    },
    sectionButton: {
        marginTop: Spacing.sm,
    },
    deleteButton: {
        backgroundColor: "#DC2626",
        borderRadius: Layout.cardRadius,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.xs,
    },
    deleteButtonText: {
        color: "#fff",
        fontFamily: Fonts.bold,
        fontSize: FontSizes.body,
    },
    disabledInput: {
        color: Colors.textSecondary,
        backgroundColor: Colors.background,
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
        color: "#DC2626",
    },
    modalBody: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        textAlign: "center",
        lineHeight: 22,
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
        color: "#DC2626",
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
    confirmDeleteButton: {
        flex: 1,
        backgroundColor: "#DC2626",
    },
});