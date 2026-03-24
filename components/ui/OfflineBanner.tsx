import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";

interface OfflineBannerProps {
    type?: "banner" | "fullscreen";
}

export function OfflineBanner({ type = "banner" }: OfflineBannerProps) {
    const { isOnline } = useNetworkStatus();
    const slideAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (!isOnline) {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [isOnline, slideAnim]);

    if (type === "fullscreen") {
        if (isOnline) return null;
        return (
            <View style={styles.fullscreenContainer}>
                <Ionicons name="cloud-offline" size={64} color={Colors.textSecondary} />
                <Text style={styles.title}>No Internet Connection</Text>
                <Text style={styles.subtitle}>
                    Please check your connection and try again.
                </Text>
            </View>
        );
    }

    return (
        <Animated.View
            style={[
                styles.bannerContainer,
                { transform: [{ translateY: slideAnim }] },
            ]}
        >
            <View style={styles.bannerContent}>
                <Ionicons name="warning" size={16} color={Colors.white} />
                <Text style={styles.bannerText}>
                    You are offline. Some features may be unavailable.
                </Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    fullscreenContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: "center",
        justifyContent: "center",
        padding: Spacing.xl,
    },
    title: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
        textAlign: "center",
    },
    subtitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        textAlign: "center",
    },
    bannerContainer: {
        backgroundColor: "#EF4444", // Red-500
        position: "absolute",
        top: Platform.OS === "ios" ? 50 : 30, // Account for status bar
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingVertical: 10,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    bannerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    bannerText: {
        color: Colors.white,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.small,
    },
});
