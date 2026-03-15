import Button from "@/components/ui/Button";
import ConfirmActionModal from "@/components/ui/ConfirmActionModal";
import DiscoverSectionRow from "@/components/ui/DiscoverSectionRow";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { useFadeSlideScaleIn } from "@/hooks/useFadeSlideScaleIn";
import { responsiveFont } from "@/utils/responsiveFont";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
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

export default function ProfileScreen() {
    const { user, signOut, isAdmin, accessToken } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const { fadeAnim, slideAnim, scaleAnim } = useFadeSlideScaleIn();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        showToast("Signed out successfully.", "info");
        router.replace("/(auth)/sign-in");
    };

    const favoriteBooks =
        useQuery(
            api.favorites.getUserFavoriteBooks,
            accessToken ? { accessToken } : "skip"
        ) ?? [];

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

                <Animated.View style={[styles.favoritesSection, { opacity: fadeAnim }]}>
                    <View style={styles.favoritesHeader}>
                        <Text style={styles.favoritesTitleText}>My Favorites</Text>
                        <Text style={styles.favoritesSubtitle}>Books you have saved</Text>
                    </View>
                    {favoriteBooks.length > 0 ? (
                        <DiscoverSectionRow
                            title=""
                            books={favoriteBooks}
                        />
                    ) : (
                        <View style={styles.emptyFavoritesCard}>
                            <Ionicons name="heart-outline" size={36} color={Colors.textLight} />
                            <Text style={styles.emptyFavoritesText}>No favorites yet</Text>
                            <Text style={styles.emptyFavoritesSubtext}>Liked books will appear here</Text>
                        </View>
                    )}
                </Animated.View>

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
        fontSize: responsiveFont(24),
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
    favoritesSection: {
        marginTop: Spacing.xl,
        marginBottom: Spacing.md,
    },
    favoritesHeader: {
        paddingHorizontal: 20,
        marginBottom: Spacing.sm,
    },
    favoritesTitleText: {
        fontSize: 22,
        color: Colors.primaryDark,
        fontFamily: Fonts.bold,
        letterSpacing: -0.4,
    },
    favoritesSubtitle: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        marginTop: 2,
    },
    emptyFavoritesCard: {
        marginHorizontal: 20,
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: Spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: "rgba(117,64,67,0.08)",
    },
    emptyFavoritesText: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginTop: Spacing.sm,
    },
    emptyFavoritesSubtext: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 4,
    },
});
