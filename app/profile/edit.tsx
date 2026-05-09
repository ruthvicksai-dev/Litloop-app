import Button from "@/components/ui/core/Button";
import InputField from "@/components/ui/core/InputField";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { useAuthState } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { getPhoneValidationError, normalizePhoneNumber } from "@/utils";
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
    const { user, accessToken, isLoading } = useAuthState();
    const { showToast } = useToast();
    const updateUserMutation = useMutation(api.users.updateUser);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);

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

    if (!user) {
        return null;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>
                    Edit Profile
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
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Personal details</Text>
                            <Text style={styles.sectionDescription}>
                                Update the information other users and our team rely on.
                            </Text>
                        </View>

                        <InputField
                            label="Full Name"
                            placeholder="Enter your name"
                            value={name}
                            onChangeText={setName}
                        />

                        <View style={styles.readOnlyBlock}>
                            <Text style={styles.readOnlyLabel}>Email Address</Text>
                            <View style={styles.readOnlyField}>
                                <Ionicons name="mail-outline" size={18} color={Colors.primaryDark} />
                                <Text style={styles.readOnlyValue}>{user.email}</Text>
                            </View>
                            <Text style={styles.readOnlyHint}>
                                Email is managed by your sign-in method and cannot be edited here.
                            </Text>
                        </View>

                        <InputField
                            label="Phone Number"
                            placeholder="Enter your phone number"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />

                        <Button
                            title="Save Changes"
                            onPress={handleSaveProfile}
                            loading={isSavingProfile}
                            style={styles.sectionButton}
                        />
                    </View>

                    <View style={styles.tipCard}>
                        <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
                        <Text style={styles.tipText}>
                            For password and account security changes, head to Settings.
                        </Text>
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
        flexGrow: 1,
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xl * 1.5,
        gap: Spacing.lg,
    },
    card: {
        paddingVertical: Spacing.xs,
    },
    sectionHeader: {
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSizes.title,
        color: Colors.text,
        fontFamily: Fonts.bold,
        marginBottom: Spacing.xs,
    },
    sectionDescription: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        lineHeight: 20,
    },
    readOnlyBlock: {
        marginBottom: Spacing.md,
    },
    readOnlyLabel: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.xs,
    },
    readOnlyField: {
        minHeight: Layout.buttonHeight,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Layout.borderRadius,
        backgroundColor: "#F7F4EE",
        paddingHorizontal: Spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    readOnlyValue: {
        flex: 1,
        fontSize: FontSizes.subtitle,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
    readOnlyHint: {
        marginTop: Spacing.xs,
        fontSize: FontSizes.small,
        color: Colors.textLight,
        fontFamily: Fonts.regular,
        lineHeight: 18,
    },
    sectionButton: {
        marginTop: Spacing.sm,
    },
    tipCard: {
        backgroundColor: Colors.white + "B8",
        borderRadius: Layout.cardRadius,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: Spacing.sm,
    },
    tipText: {
        flex: 1,
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        lineHeight: 20,
    },
});
