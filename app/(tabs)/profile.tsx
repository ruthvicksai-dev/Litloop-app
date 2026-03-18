import BookLoader from "@/components/ui/BookLoader";
import ConfirmActionModal from "@/components/ui/ConfirmActionModal";
import DiscoverSectionRow from "@/components/ui/DiscoverSectionRow";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { useFadeSlideScaleIn } from "@/hooks";
import { responsiveFont } from "@/utils/responsiveFont";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

export default function ProfileScreen() {
    const { user, signOut, isAdmin, accessToken } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const { fadeAnim, slideAnim, scaleAnim } = useFadeSlideScaleIn();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Tab State: "favorites" | "readLater"
    const [activeTab, setActiveTab] = useState<"favorites" | "readLater">("favorites");

    // Animations for tabs
    const slideAnimDist = useRef(new Animated.Value(0)).current;
    const listOpacity = useRef(new Animated.Value(1)).current;

    const handleSignOut = async () => {
        await signOut();
        showToast("Signed out successfully.", "info");
        router.replace("/(auth)/sign-in");
    };

    const handleTabChange = (tab: "favorites" | "readLater") => {
        if (tab === activeTab) return;

        // Slide out
        Animated.parallel([
            Animated.timing(listOpacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnimDist, {
                toValue: tab === "favorites" ? -20 : 20,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setActiveTab(tab);

            // Prepare for slide in from opposite side
            slideAnimDist.setValue(tab === "favorites" ? 20 : -20);

            // Slide in
            Animated.parallel([
                Animated.timing(listOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnimDist, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    const favoriteBooks =
        useQuery(
            api.favorites.getUserFavoriteBooks,
            accessToken ? { accessToken } : "skip"
        );

    const favoriteCount =
        useQuery(
            api.favorites.getUserFavoriteCount,
            accessToken ? { accessToken } : "skip"
        );

    const readLaterBooks =
        useQuery(
            api.readLater.getUserReadLaterBooks,
            accessToken ? { accessToken } : "skip"
        );

    const readLaterCount =
        useQuery(
            api.readLater.getUserReadLaterCount,
            accessToken ? { accessToken } : "skip"
        );

    const activeBooks = activeTab === "favorites" ? favoriteBooks : readLaterBooks;

    return (
        <View style={styles.container}>
            {/* Background Gradient for Premium feel */}
            <LinearGradient
                colors={["#E6F4FE", Colors.background]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 0.3 }}
            />

            <SafeAreaView style={styles.safeArea}>
                {favoriteBooks === undefined || readLaterBooks === undefined ? (
                    <View style={styles.center}>
                        <BookLoader label="Loading profile..." />
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                        stickyHeaderIndices={[2]} // Make the tabs sticky
                    >
                        {/* Header Title */}
                        <Animated.View
                            style={[
                                styles.header,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }],
                                },
                            ]}
                        >
                            <Text style={styles.pageTitle}>Profile</Text>
                            <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowLogoutConfirm(true)}>
                                <Ionicons name="log-out-outline" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Premium User Card */}
                        <Animated.View
                            style={[
                                styles.userCard,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }],
                                },
                            ]}
                        >
                            <LinearGradient
                                colors={["#FFFFFF", "rgba(255,255,255,0.8)"]}
                                style={StyleSheet.absoluteFillObject}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            />

                            <View style={styles.userCardContent}>
                                <Animated.View
                                    style={[
                                        styles.avatarContainer,
                                        { transform: [{ scale: scaleAnim }] },
                                    ]}
                                >
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>
                                            {user?.name?.charAt(0).toUpperCase() || "U"}
                                        </Text>
                                    </View>
                                    {isAdmin && (
                                        <View style={styles.adminBadgeIcon}>
                                            <Ionicons name="shield-checkmark" size={14} color={Colors.white} />
                                        </View>
                                    )}
                                </Animated.View>

                                <View style={styles.userInfo}>
                                    <Text style={styles.name}>{user?.name}</Text>
                                    <Text style={styles.email}>{user?.email}</Text>
                                    <Text style={styles.phone}>{user?.phone}</Text>
                                </View>
                            </View>

                            {/* Quick Stats */}
                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statNumber}>{favoriteCount ?? 0}</Text>
                                    <Text style={styles.statLabel}>Favorites</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statBox}>
                                    <Text style={styles.statNumber}>{readLaterCount ?? 0}</Text>
                                    <Text style={styles.statLabel}>Read Later</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <TouchableOpacity
                                    style={styles.editProfileBtn}
                                    onPress={() => router.push("/profile/edit")}
                                >
                                    <Ionicons name="pencil" size={18} color={Colors.primary} />
                                    <Text style={styles.editProfileText}>Edit</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>

                        {isAdmin && (
                            <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20 }}>
                                <TouchableOpacity
                                    style={styles.adminLink}
                                    onPress={() => router.replace("/(admin)/dashboard")}
                                >
                                    <LinearGradient
                                        colors={[Colors.primary, Colors.primaryDark]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={StyleSheet.absoluteFillObject}
                                    />
                                    <Ionicons name="settings-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                                    <Text style={styles.adminLinkText}>Admin Dashboard</Text>
                                    <Ionicons name="arrow-forward" size={18} color={Colors.white} style={{ marginLeft: "auto" }} />
                                </TouchableOpacity>
                            </Animated.View>
                        )}

                        {/* Segmented Control Tabs */}
                        <Animated.View style={[styles.tabsContainer, { opacity: fadeAnim }]}>
                            <View style={styles.tabsWrapper}>
                                <Pressable
                                    style={[styles.tab, activeTab === "favorites" && styles.activeTab]}
                                    onPress={() => handleTabChange("favorites")}
                                >
                                    <Ionicons
                                        name={activeTab === "favorites" ? "heart" : "heart-outline"}
                                        size={18}
                                        color={activeTab === "favorites" ? Colors.white : Colors.textSecondary}
                                    />
                                    <Text style={[styles.tabText, activeTab === "favorites" && styles.activeTabText]}>
                                        Favorites
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.tab, activeTab === "readLater" && styles.activeTab]}
                                    onPress={() => handleTabChange("readLater")}
                                >
                                    <Ionicons
                                        name={activeTab === "readLater" ? "bookmark" : "bookmark-outline"}
                                        size={18}
                                        color={activeTab === "readLater" ? Colors.white : Colors.textSecondary}
                                    />
                                    <Text style={[styles.tabText, activeTab === "readLater" && styles.activeTabText]}>
                                        Read Later
                                    </Text>
                                </Pressable>
                            </View>
                        </Animated.View>

                        {/* List Section */}
                        <Animated.View
                            style={[
                                styles.listSection,
                                {
                                    opacity: listOpacity,
                                    transform: [{ translateX: slideAnimDist }]
                                }
                            ]}
                        >
                            {activeBooks!.length > 0 ? (
                                <DiscoverSectionRow
                                    title={activeTab === "favorites" ? "Loved Books" : "Saved For Later"}
                                    subtitle={activeTab === "favorites" ? "Books you have liked" : "Your reading list"}
                                    books={activeBooks!}
                                />
                            ) : (
                                <View style={styles.emptyCard}>
                                    <Ionicons
                                        name={activeTab === "favorites" ? "heart-outline" : "bookmark-outline"}
                                        size={48}
                                        color={Colors.border}
                                    />
                                    <Text style={styles.emptyText}>
                                        {activeTab === "favorites" ? "No favorites yet" : "Read list is empty"}
                                    </Text>
                                    <Text style={styles.emptySubtext}>
                                        {activeTab === "favorites"
                                            ? "Books you like will appear here."
                                            : "Save books to read them later."}
                                    </Text>
                                </View>
                            )}
                        </Animated.View>
                    </ScrollView>
                )}
            </SafeAreaView>

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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        paddingBottom: 100,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    pageTitle: {
        fontSize: responsiveFont(28),
        color: Colors.text,
        fontFamily: Fonts.bold,
        letterSpacing: -0.5,
    },
    settingsBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    userCard: {
        marginHorizontal: 20,
        borderRadius: 24,
        overflow: "hidden",
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    userCardContent: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.lg,
    },
    avatarContainer: {
        position: "relative",
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: Colors.white,
    },
    avatarText: {
        fontSize: FontSizes.display,
        fontFamily: Fonts.bold,
        color: Colors.white,
    },
    adminBadgeIcon: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: Colors.success,
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: Colors.white,
    },
    userInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    name: {
        fontSize: FontSizes.heading,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 2,
    },
    email: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        marginBottom: 2,
    },
    phone: {
        fontSize: FontSizes.small,
        color: Colors.textLight,
        fontFamily: Fonts.regular,
    },
    statsRow: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
        backgroundColor: "rgba(255,255,255,0.4)",
    },
    statBox: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: "center",
        justifyContent: "center",
    },
    statDivider: {
        width: 1,
        backgroundColor: "rgba(0,0,0,0.05)",
        marginVertical: Spacing.sm,
    },
    statNumber: {
        fontSize: FontSizes.heading,
        fontFamily: Fonts.bold,
        color: Colors.primaryDark,
    },
    statLabel: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    editProfileBtn: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 6,
    },
    editProfileText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    adminLink: {
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: "center",
        flexDirection: "row",
        overflow: "hidden",
        marginBottom: Spacing.lg,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    adminLinkText: {
        color: Colors.white,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.bodyLarge,
    },
    tabsContainer: {
        backgroundColor: Colors.background,
        paddingHorizontal: 20,
        paddingBottom: Spacing.xs,
        zIndex: 10,
    },
    tabsWrapper: {
        flexDirection: "row",
        backgroundColor: "rgba(0,0,0,0.04)",
        borderRadius: 16,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    activeTab: {
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
    },
    activeTabText: {
        color: Colors.white,
    },
    listSection: {
        paddingTop: Spacing.md,
        minHeight: height * 0.5,
        backgroundColor: "transparent",
    },
    emptyCard: {
        marginHorizontal: 20,
        marginTop: Spacing.xl,
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 40,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: Colors.border + "40", // Subtle border instead of shadow
    },
    emptyText: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginTop: Spacing.md,
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.regular,
        color: Colors.textLight,
        textAlign: "center",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
