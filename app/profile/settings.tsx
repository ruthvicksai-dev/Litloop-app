import { CommonSettingsSections } from "@/components/shared/CommonSettingsSections";
import { SettingsSkeleton } from "@/components/ui/skeletons/SettingsSkeleton";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { useAuthState } from "@/context/AuthContext";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
    const router = useRouter();
    const { user } = useAuthState();

    if (!user) {
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
                <SettingsSkeleton />
            </SafeAreaView>
        );
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
                {/* ─── Account Section (user-specific) ─── */}
                <Text style={styles.sectionLabel}>ACCOUNT</Text>
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
                            <Ionicons name="person-outline" size={18} color={Colors.primary} />
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
                            <Ionicons name="lock-closed-outline" size={18} color={Colors.primaryDark} />
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
                            <Ionicons name="help-buoy-outline" size={18} color={Colors.primaryDark} />
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
                </View>

                {/* ─── Shared: Notifications, Legal, Danger, Sign Out ─── */}
                <CommonSettingsSections />
            </ScrollView>
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
    sectionLabel: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: Spacing.sm,
        paddingHorizontal: 4,
    },
    section: {
        backgroundColor: Colors.surfaceCard,
        borderRadius: 16,
        paddingVertical: Spacing.xs,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
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
        flex: 1,
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    rowChevron: {
        marginLeft: "auto",
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
        backgroundColor: Colors.border + "60",
    },
});
