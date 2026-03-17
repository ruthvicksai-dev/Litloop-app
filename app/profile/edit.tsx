import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
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

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, accessToken, isLoading } = useAuth();
    const { showToast } = useToast();
    const updateUserMutation = useMutation(api.users.updateUser);
    const changePasswordMutation = useMutation(api.auth.changePassword);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

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

        setIsSavingProfile(true);
        try {
            await updateUserMutation({
                accessToken,
                name,
                phone,
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
        if (newPassword.length < 6) {
            showToast("New password must be at least 6 characters.", "error");
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
                            placeholder="Enter new password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                        />
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
    content: {
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.xl,
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
    disabledInput: {
        color: Colors.textSecondary,
        backgroundColor: Colors.background,
    },
});
