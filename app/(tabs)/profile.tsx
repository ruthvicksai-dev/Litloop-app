import ConfirmActionModal from "@/components/ui/ConfirmActionModal";
import Button from "@/components/ui/Button";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useFadeSlideScaleIn } from "@/hooks/useFadeSlideScaleIn";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts, FontSizes } from "@/constants/fonts";

export default function ProfileScreen() {
    const { user, signOut, isAdmin } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const { fadeAnim, slideAnim, scaleAnim } = useFadeSlideScaleIn();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        showToast("Signed out successfully.", "info");
        router.replace("/(auth)/sign-in");
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View
                    style={[
                        styles.header,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <Text style={styles.title}>Profile</Text>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.card,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.avatar,
                            { transform: [{ scale: scaleAnim }] },
                        ]}
                    >
                        <Text style={styles.avatarText}>
                            {user?.name?.charAt(0).toUpperCase() || "U"}
                        </Text>
                    </Animated.View>
                    <Text style={styles.name}>{user?.name}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                    <Text style={styles.phone}>{user?.phone}</Text>
                    <View
                        style={[
                            styles.roleBadge,
                            isAdmin && { backgroundColor: Colors.primary + "20" },
                        ]}
                    >
                        <Text
                            style={[
                                styles.roleText,
                                isAdmin && { color: Colors.primary },
                            ]}
                        >
                            {isAdmin ? "Admin" : "User"}
                        </Text>
                    </View>
                </Animated.View>

                {isAdmin ? (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <TouchableOpacity
                            style={styles.adminLink}
                            onPress={() => router.replace("/(admin)/dashboard")}
                        >
                            <Ionicons name="settings-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                            <Text style={styles.adminLinkText}>Go to Admin Dashboard</Text>
                        </TouchableOpacity>
                    </Animated.View>
                ) : null}

                <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
                    <Button
                        title="Sign Out"
                        onPress={() => setShowLogoutConfirm(true)}
                        variant="outline"
                        style={{ marginTop: Spacing.md }}
                    />
                </Animated.View>
            </ScrollView>

            <ConfirmActionModal
                visible={showLogoutConfirm}
                title="Sign Out?"
                message="Are you sure you want to log out of your account?"
                confirmLabel="Log Out"
                cancelLabel="Stay Here"
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
    content: {
        flexGrow: 1,
        paddingBottom: Spacing.xl,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: FontSizes.hero,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    card: {
        backgroundColor: Colors.white,
        marginHorizontal: 20,
        borderRadius: 16,
        padding: Spacing.lg,
        alignItems: "center",
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    avatar: {
        width: 88,
        aspectRatio: 1,
        borderRadius: 44,
        backgroundColor: Colors.primary,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: Spacing.md,
    },
    avatarText: {
        fontSize: FontSizes.display,
        fontFamily: Fonts.bold,
        color: Colors.white,
    },
    name: {
        fontSize: FontSizes.heading,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 4,
    },
    email: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        marginBottom: 2,
        fontFamily: Fonts.regular,
    },
    phone: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        fontFamily: Fonts.regular,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: Colors.border,
    },
    roleText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    adminLink: {
        marginHorizontal: 20,
        marginTop: Spacing.md,
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
    },
    adminLinkText: {
        color: Colors.white,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.bodyLarge,
    },
    actions: {
        paddingHorizontal: 20,
        marginTop: Spacing.md,
    },
});
