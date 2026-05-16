import Button from "@/components/ui/core/Button";
import InputField from "@/components/ui/core/InputField";
import PasswordRequirements from "@/components/ui/auth/PasswordRequirements";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { useAuthState } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePasswordScreen() {
    const router = useRouter();
    const { user, accessToken, isLoading } = useAuthState();
    const { showToast } = useToast();
    const changePasswordMutation = useMutation(api.auth.changePassword);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/(auth)/sign-in");
        }
    }, [isLoading, router, user]);

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
            router.back();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Failed to change password.";
            showToast(message, "error");
        } finally {
            setIsSavingPassword(false);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>
                    Change Password
                </Text>
                <View style={styles.headerSpacer} />
            </View>

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
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Security</Text>
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
                            showPasswordToggle={false}
                        />
                        <Button
                            title="Update Password"
                            onPress={handleChangePassword}
                            loading={isSavingPassword}
                            style={styles.sectionButton}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
    headerBar: {
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
        flexGrow: 1,
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xl * 1.5,
        gap: Spacing.lg,
    },
    card: {
        paddingVertical: Spacing.xs,
    },
    sectionTitle: {
        fontSize: FontSizes.title,
        color: Colors.text,
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
});
