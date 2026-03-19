import { ProfileUserCard } from "@/components/profile/ProfileUserCard";
import { BookCardSkeleton } from "@/components/ui/BookCardSkeleton";
import ConfirmActionModal from "@/components/ui/ConfirmActionModal";
import DiscoverSectionRow from "@/components/ui/DiscoverSectionRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedControl, SegmentOption } from "@/components/ui/SegmentedControl";
import { Skeleton } from "@/components/ui/Skeleton";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { useFadeSlideScaleIn, useProfileTabs } from "@/hooks";
import { triggerHaptic } from "@/utils/haptics";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Animated,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

const TAB_OPTIONS: SegmentOption[] = [
    { label: "Favorites", value: "favorites", icon: "heart-outline", activeIcon: "heart" },
    { label: "Read Later", value: "readLater", icon: "bookmark-outline", activeIcon: "bookmark" },
];

export default function ProfileScreen() {
    const { user, signOut, isAdmin, accessToken } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const { fadeAnim, slideAnim, scaleAnim } = useFadeSlideScaleIn();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const {
        activeTab,
        handleTabChange,
        slideAnimDist,
        listOpacity,
    } = useProfileTabs();

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        triggerHaptic("light");
        setTimeout(() => setRefreshing(false), 800);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        showToast("Signed out successfully.", "info");
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

    const onTabChange = (value: string) => {
        triggerHaptic("light");
        handleTabChange(value as any);
    };

    if (favoriteBooks === undefined || readLaterBooks === undefined) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Skeleton width={120} height={32} />
                    <Skeleton width={44} height={44} borderRadius={22} />
                </View>
                <View style={{ paddingHorizontal: 20 }}>
                    <Skeleton width="100%" height={150} borderRadius={20} />
                    <View style={{ height: 50, marginTop: 20 }}>
                        <Skeleton width="100%" height={40} borderRadius={10} />
                    </View>
                    <View style={{ marginTop: 20 }}>
                        <BookCardSkeleton />
                        <BookCardSkeleton />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    stickyHeaderIndices={[2]} // Make the tabs sticky
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                    }
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
                        <Text style={styles.pageTitle} allowFontScaling={false}>
                            Profile
                        </Text>
                        <TouchableOpacity
                            style={styles.settingsBtn}
                            onPress={() => {
                                triggerHaptic("medium");
                                setShowLogoutConfirm(true);
                            }}
                        >
                            <Ionicons name="log-out-outline" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Premium User Card */}
                    <ProfileUserCard
                        user={user}
                        isAdmin={isAdmin ?? false}
                        favoriteCount={favoriteCount ?? 0}
                        readLaterCount={readLaterCount ?? 0}
                        onEditProfile={() => router.push("/profile/edit")}
                        fadeAnim={fadeAnim}
                        slideAnim={slideAnim}
                        scaleAnim={scaleAnim}
                    />

                    {isAdmin && (
                        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 20 }}>
                            <TouchableOpacity
                                style={styles.adminLink}
                                onPress={() => {
                                    triggerHaptic("medium");
                                    router.replace("/(admin)/dashboard");
                                }}
                            >
                                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.primary, borderRadius: 16 }]} />
                                <Ionicons name="settings-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                                <Text style={styles.adminLinkText} allowFontScaling={false}>
                                    Admin Dashboard
                                </Text>
                                <Ionicons name="arrow-forward" size={18} color={Colors.white} style={{ marginLeft: "auto" }} />
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* Segmented Control Tabs */}
                    <SegmentedControl
                        options={TAB_OPTIONS}
                        activeValue={activeTab}
                        onChange={onTabChange}
                        fadeAnim={fadeAnim}
                    />

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
                        {activeBooks && activeBooks.length > 0 ? (
                            <DiscoverSectionRow
                                title={activeTab === "favorites" ? "Loved Books" : "Saved For Later"}
                                subtitle={activeTab === "favorites" ? "Books you have liked" : "Your reading list"}
                                books={activeBooks}
                            />
                        ) : (
                            <View style={styles.emptyWrapper}>
                                <EmptyState
                                    icon={activeTab === "favorites" ? "heart-outline" : "bookmark-outline"}
                                    title={activeTab === "favorites" ? "No favorites yet" : "Read list is empty"}
                                    subtitle={activeTab === "favorites"
                                        ? "Books you like will appear here."
                                        : "Save books to read them later."}
                                />
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>
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
        backgroundColor: Colors.background,
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
        fontSize: 28,
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
    listSection: {
        paddingTop: Spacing.md,
        minHeight: height * 0.5,
        backgroundColor: "transparent",
    },
    emptyWrapper: {
        marginHorizontal: 20,
        marginTop: Spacing.xl,
        backgroundColor: Colors.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border + "40",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
