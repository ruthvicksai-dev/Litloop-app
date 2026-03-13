import Button from "@/components/ui/Button";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useFadeSlideScaleIn } from "@/hooks/useFadeSlideScaleIn";
import { useRouter } from "expo-router";
import React from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ProfileScreen() {
    const { user, signOut, isAdmin } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const { fadeAnim, slideAnim, scaleAnim } = useFadeSlideScaleIn();

    const handleSignOut = async () => {
        await signOut();
        showToast("Signed out successfully.", "info");
        router.replace("/(auth)/sign-in");
    };

    return (
        <SafeAreaView style={styles.container}>
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
                        onPress={() => router.push("/(admin)/dashboard")}
                    >
                        <Text style={styles.adminLinkText}>ðŸ›  Go to Admin Dashboard</Text>
                    </TouchableOpacity>
                </Animated.View>
            ) : null}

            <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
                <Button
                    title="Sign Out"
                    onPress={handleSignOut}
                    variant="outline"
                    style={{ marginTop: Spacing.md }}
                />
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingTop: SCREEN_HEIGHT * 0.02,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: SCREEN_WIDTH * 0.065,
        fontWeight: "800",
        color: Colors.text,
    },
    card: {
        backgroundColor: Colors.white,
        marginHorizontal: SCREEN_WIDTH * 0.06,
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
        width: SCREEN_WIDTH * 0.18,
        height: SCREEN_WIDTH * 0.18,
        borderRadius: SCREEN_WIDTH * 0.09,
        backgroundColor: Colors.primary,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: Spacing.md,
    },
    avatarText: {
        fontSize: SCREEN_WIDTH * 0.07,
        fontWeight: "700",
        color: Colors.white,
    },
    name: {
        fontSize: SCREEN_WIDTH * 0.05,
        fontWeight: "700",
        color: Colors.text,
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    phone: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: Colors.border,
    },
    roleText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.textSecondary,
    },
    adminLink: {
        marginHorizontal: SCREEN_WIDTH * 0.06,
        marginTop: Spacing.md,
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    adminLinkText: {
        color: Colors.white,
        fontWeight: "600",
        fontSize: 15,
    },
    actions: {
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        marginTop: Spacing.md,
    },
});
