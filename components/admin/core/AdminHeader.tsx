import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AdminHeaderProps {
    title: string;
    rightComponent?: React.ReactNode;
    onBack?: () => void;
    showBack?: boolean;
    variant?: "default" | "dark";
}

export default function AdminHeader({
    title,
    rightComponent,
    onBack,
    showBack = true,
    variant = "dark",
}: AdminHeaderProps) {
    const router = useRouter();
    const isDark = variant === "dark";

    return (
        <View style={[styles.wrapper, isDark && styles.darkWrapper]}>
            <StatusBar style={isDark ? "light" : "dark"} backgroundColor={isDark ? Colors.primaryDark : Colors.background} />
            <SafeAreaView edges={["top"]} style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={styles.sideContainer}>
                        {showBack && (
                            <TouchableOpacity 
                                onPress={onBack || (() => router.back())} 
                                style={styles.backBtn}
                                accessibilityRole="button"
                                accessibilityLabel="Go back"
                            >
                                <Ionicons name="chevron-back" size={20} color={isDark ? Colors.white : Colors.text} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={[styles.headerTitle, isDark && styles.darkTitle]} allowFontScaling={false} numberOfLines={1}>
                        {title}
                    </Text>
                    <View style={[styles.sideContainer, styles.rightContainer]}>
                        {rightComponent}
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: Colors.background,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: "hidden",
    },
    darkWrapper: {
        backgroundColor: Colors.primaryDark,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: "hidden",
    },
    safeArea: {
        width: "100%",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingVertical: Spacing.md,
        minHeight: 56,
    },
    sideContainer: {
        position: "absolute",
        left: 16,
        zIndex: 10,
        flexDirection: "row",
        alignItems: "center",
    },
    rightContainer: {
        left: undefined,
        right: 16,
        justifyContent: "flex-end",
    },
    backBtn: {
        padding: 4,
        marginLeft: -4,
    },
    headerTitle: {
        fontSize: FontSizes.subtitle,
        color: Colors.text,
        textAlign: "center",
        fontFamily: Fonts.bold,
        flexShrink: 1,
        paddingHorizontal: 40,
    },
    darkTitle: {
        color: Colors.white,
    },
});
