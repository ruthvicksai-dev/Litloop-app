import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AdminHeaderProps {
    title: string;
    rightComponent?: React.ReactNode;
    onBack?: () => void;
    showBack?: boolean;
}

export default function AdminHeader({ title, rightComponent, onBack, showBack = true }: AdminHeaderProps) {
    const router = useRouter();

    return (
        <View style={styles.header}>
            <View style={styles.sideContainer}>
                {showBack && (
                    <TouchableOpacity 
                        onPress={onBack || (() => router.back())} 
                        style={styles.backBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <Ionicons name="chevron-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                )}
            </View>
            <Text style={styles.headerTitle} allowFontScaling={false} numberOfLines={1}>
                {title}
            </Text>
            <View style={[styles.sideContainer, styles.rightContainer]}>
                {rightComponent}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
        paddingVertical: Spacing.md,
        minHeight: 56,
    },
    sideContainer: {
        position: "absolute",
        left: 20,
        zIndex: 10,
        flexDirection: "row",
        alignItems: "center",
    },
    rightContainer: {
        left: undefined,
        right: 20,
        justifyContent: "flex-end",
    },
    backBtn: {
        padding: 4,
        marginLeft: -4,
    },
    headerTitle: {
        fontSize: FontSizes.title,
        color: Colors.text,
        textAlign: "center",
        fontFamily: Fonts.bold,
        flexShrink: 1,
        paddingHorizontal: 48,
    },
});
