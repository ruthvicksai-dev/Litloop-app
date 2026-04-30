import Button from "@/components/ui/core/Button";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface GuestViewProps {
    title: string;
    subtitle: string;
    icon?: keyof typeof Ionicons.glyphMap;
    headerTitle?: string;
    showBackButton?: boolean;
}

export function GuestView({
    title,
    subtitle,
    icon = "person-circle-outline",
    headerTitle,
    showBackButton = false,
}: GuestViewProps) {
    const router = useRouter();

    const handleLogin = () => {
        triggerHaptic("medium");
        router.push("/(auth)/sign-in");
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                {showBackButton ? (
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.headerSpacer} />
                )}
                {headerTitle && (
                    <Text style={styles.pageTitle} allowFontScaling={false}>
                        {headerTitle}
                    </Text>
                )}
                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon as any} size={100} color={Colors.primary} />
                </View>

                <Text style={styles.title} allowFontScaling={false}>
                    {title}
                </Text>
                <Text style={styles.subtitle} allowFontScaling={false}>
                    {subtitle}
                </Text>

                <Button
                    title="Sign In / Register"
                    onPress={handleLogin}
                    style={styles.button}
                />
            </View>
        </SafeAreaView>
    );
}

// Re-export as GuestProfileView for backward compatibility if needed, 
// but we'll eventually update all imports.
export const GuestProfileView = () => (
    <GuestView
        title="Login to access your profile"
        subtitle="Join Litloop to manage your rentals, save your favorite books, and more!"
        headerTitle="Profile"
    />
);

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
        alignItems: "center",
        justifyContent: "center",
    },
    headerSpacer: {
        width: 40,
    },
    pageTitle: {
        fontSize: FontSizes.title,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        paddingBottom: 60,
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: Colors.primary + "10",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        textAlign: "center",
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        textAlign: "center",
        marginBottom: Spacing.xl,
        lineHeight: 22,
    },
    button: {
        width: "100%",
        borderRadius: 16,
    },
});


