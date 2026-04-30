import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface OfflineBannerProps {
    type?: "banner" | "fullscreen";
}

export function OfflineBanner({ type = "banner" }: OfflineBannerProps) {
    const { isOnline } = useNetworkStatus();
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(-100)).current;

    // Animations for fullscreen mode
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [isChecking, setIsChecking] = useState(false);

    // Initial enter animation for fullscreen
    useEffect(() => {
        if (!isOnline && type === "fullscreen") {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
            }).start();

            // Continuous pulse animation for the icon background
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 1000,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease),
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease),
                    }),
                ])
            ).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [isOnline, type]);

    // Slide animation for banner mode
    useEffect(() => {
        if (type === "banner") {
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
        }
    }, [isOnline, slideAnim, type]);

    const handleCheckConnection = async () => {
        setIsChecking(true);
        try {
            await NetInfo.fetch();
            // Minimum artificial delay so the button interaction feels real
            await new Promise((resolve) => setTimeout(resolve, 800));
        } finally {
            setIsChecking(false);
        }
    };

    if (type === "fullscreen") {
        if (isOnline) return null;

        return (
            <Animated.View style={[styles.fullscreenContainer, { opacity: fadeAnim }]}>
                <View style={styles.card}>
                    <View style={styles.iconWrapper}>
                        <Animated.View
                            style={[
                                styles.iconPulseBg,
                                { transform: [{ scale: pulseAnim }] }
                            ]}
                        />
                        <View style={styles.iconInner}>
                            <Ionicons name="wifi" size={44} color={Colors.white} />
                            <View style={styles.crossSlash} />
                        </View>
                    </View>

                    <Text style={styles.title} allowFontScaling={false}>
                        Oops! No Connection
                    </Text>
                    <Text style={styles.subtitle} allowFontScaling={false}>
                        It seems you're offline. Please check your Wi-Fi or mobile network to continue browsing the library.
                    </Text>

                    <TouchableOpacity
                        style={[styles.retryBtn, isChecking && styles.retryBtnDisabled]}
                        activeOpacity={0.8}
                        onPress={handleCheckConnection}
                        disabled={isChecking}
                    >
                        <Text style={styles.retryText} allowFontScaling={false}>
                            {isChecking ? "Checking..." : "Check Connection"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            style={[
                styles.bannerContainer,
                { transform: [{ translateY: slideAnim }] },
                { paddingTop: Platform.OS === "ios" ? insets.top + 10 : insets.top + 30 }
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
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999, // Ensure it's above absolutely everything
        backgroundColor: "rgba(255, 255, 255, 0.96)",
        alignItems: "center",
        justifyContent: "center",
        padding: Spacing.xl,
    },
    card: {
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing.xl,
        paddingVertical: 40,
        borderRadius: 28,
        alignItems: "center",
        width: "100%",
        maxWidth: 400,
        // Premium shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.03)",
    },
    iconWrapper: {
        width: 100,
        height: 100,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.xl,
    },
    iconPulseBg: {
        position: "absolute",
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(239, 68, 68, 0.15)", // Red-500 washed out
    },
    iconInner: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#EF4444", // Red-500
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    crossSlash: {
        position: "absolute",
        width: 4,
        height: 60,
        backgroundColor: Colors.white,
        transform: [{ rotate: "45deg" }],
    },
    title: {
        fontSize: 26,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
        textAlign: "center",
        letterSpacing: -0.4,
    },
    subtitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 32,
    },
    retryBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 100,
        width: "100%",
        alignItems: "center",
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    retryBtnDisabled: {
        opacity: 0.7,
    },
    retryText: {
        color: Colors.white,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.bodyLarge,
    },
    bannerContainer: {
        backgroundColor: "#EF4444",
        position: "absolute",
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingBottom: 12,
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
