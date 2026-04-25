import ConfirmActionModal from "@/components/ui/ConfirmActionModal";
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
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
    const router = useRouter();
    const { user, accessToken, signOut } = useAuth();
    const { showToast } = useToast();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const updatePushToken = useMutation(api.notifications.updatePushToken);
    const clearPushToken = useMutation(api.notifications.clearPushToken);

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
                const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
                if (!projectId) return;
                const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
                await updatePushToken({ accessToken, pushToken });
                showToast("Push notifications enabled.", "success");
            } catch (e) {
                console.warn("[Settings] Failed to get push token", e);
                showToast("Failed to enable push notifications.", "error");
            }
        } else {
            if (user?.pushToken) {
                await clearPushToken({ accessToken, pushToken: user.pushToken });
                showToast("Push notifications disabled.", "info");
            }
        }
    };

    const handleSignOut = async () => {
        await signOut();
        showToast("Signed out successfully.", "info");
        router.replace("/(auth)/sign-in");
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backBtn}
                >
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>
                    Settings
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle} allowFontScaling={false}>Account</Text>
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => {
                            triggerHaptic("light");
                            router.push("/profile/edit");
                        }}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: `${Colors.primary}15` }]}>
                            <Ionicons name="person-outline" size={18} color={Colors.primary} />
                        </View>
                        <Text style={styles.rowText} allowFontScaling={false}>Edit Profile</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.textLight} style={{ marginLeft: "auto" }} />
                    </TouchableOpacity>
                </View>

                {/* App Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle} allowFontScaling={false}>App Settings</Text>
                    <View style={styles.row}>
                        <View style={[styles.iconContainer, { backgroundColor: `${Colors.primaryDark}15` }]}>
                            <Ionicons name="notifications-outline" size={18} color={Colors.primaryDark} />
                        </View>
                        <Text style={styles.rowText} allowFontScaling={false}>Push Notifications</Text>
                        <View style={{ marginLeft: "auto" }}>
                            <Switch
                                value={!!user?.pushToken}
                                onValueChange={handleTogglePush}
                                trackColor={{ false: Colors.border, true: Colors.primary }}
                                thumbColor={Colors.white}
                            />
                        </View>
                    </View>
                </View>

                {/* Legal Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle} allowFontScaling={false}>Legal</Text>
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => {
                            triggerHaptic("light");
                            router.push("/legal/privacy-policy" as any);
                        }}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: `${Colors.primary}15` }]}>
                            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
                        </View>
                        <Text style={styles.rowText} allowFontScaling={false}>Privacy Policy</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.textLight} style={{ marginLeft: "auto" }} />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => {
                            triggerHaptic("light");
                            router.push("/legal/terms-of-service" as any);
                        }}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: `${Colors.textSecondary}15` }]}>
                            <Ionicons name="document-text-outline" size={18} color={Colors.textSecondary} />
                        </View>
                        <Text style={styles.rowText} allowFontScaling={false}>Terms of Service</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.textLight} style={{ marginLeft: "auto" }} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.signOutBtn}
                    onPress={() => {
                        triggerHaptic("medium");
                        setShowLogoutConfirm(true);
                    }}
                >
                    <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                    <Text style={styles.signOutText} allowFontScaling={false}>Sign Out</Text>
                </TouchableOpacity>
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
    divider: {
        height: 1,
        marginHorizontal: 16,
        backgroundColor: Colors.border + "60",
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
});
