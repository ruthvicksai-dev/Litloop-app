import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

type ProfileUserCardProps = {
    user: any;
    isAdmin: boolean;
    favoriteCount: number;
    readLaterCount: number;
    fadeAnim: Animated.Value;
    slideAnim: Animated.Value;
    scaleAnim: Animated.Value;
};

export function ProfileUserCard({
    user,
    isAdmin,
    favoriteCount,
    readLaterCount,
    fadeAnim,
    slideAnim,
    scaleAnim,
}: ProfileUserCardProps) {
    return (
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
                        <Text style={styles.avatarText} allowFontScaling={false}>
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
                    <Text style={styles.name} allowFontScaling={false}>
                        {user?.name}
                    </Text>
                    <Text style={styles.email} allowFontScaling={false}>
                        {user?.email}
                    </Text>
                    <Text style={styles.phone} allowFontScaling={false}>
                        {user?.phone}
                    </Text>
                </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber} allowFontScaling={false}>
                        {favoriteCount ?? 0}
                    </Text>
                    <Text style={styles.statLabel} allowFontScaling={false}>
                        Favorites
                    </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statNumber} allowFontScaling={false}>
                        {readLaterCount ?? 0}
                    </Text>
                    <Text style={styles.statLabel} allowFontScaling={false}>
                        Read Later
                    </Text>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
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
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 2,
    },
    email: {
        fontSize: FontSizes.small,
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
});
