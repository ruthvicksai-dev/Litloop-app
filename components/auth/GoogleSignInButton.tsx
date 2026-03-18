import { isGoogleSignInEnabled } from "@/constants/features";
import { Colors } from "@/constants/theme";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface GoogleSignInButtonProps {
    onSuccess?: () => void;
}

export function GoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
    if (!isGoogleSignInEnabled) {
        return (
            <View style={styles.container}>
                <View style={[styles.button, styles.comingSoon]}>
                    <Ionicons
                        name="logo-google"
                        size={20}
                        color="#9CA3AF"
                        style={styles.icon}
                    />
                    <Text style={styles.comingSoonText}>Continue with Google</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Soon</Text>
                    </View>
                </View>
            </View>
        );
    }

    return <EnabledGoogleSignInButton onSuccess={onSuccess} />;
}

function EnabledGoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
    const { signIn, isLoading, error } = useGoogleAuth();

    const handlePress = async () => {
        await signIn();
        if (!error && onSuccess) {
            onSuccess();
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.button, isLoading && styles.disabled]}
                onPress={handlePress}
                disabled={isLoading}
                activeOpacity={0.7}
            >
                {isLoading ? (
                    <ActivityIndicator color={Colors.primary} />
                ) : (
                    <>
                        <Ionicons
                            name="logo-google"
                            size={20}
                            color="#374151"
                            style={styles.icon}
                        />
                        <Text style={styles.buttonText}>Continue with Google</Text>
                    </>
                )}
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        marginVertical: 10,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    comingSoon: {
        backgroundColor: "#F9FAFB",
        borderColor: "#E5E7EB",
        opacity: 0.7,
    },
    disabled: {
        opacity: 0.6,
    },
    icon: {
        marginRight: 10,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#374151",
    },
    comingSoonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#9CA3AF",
        flex: 1,
    },
    badge: {
        backgroundColor: "#FEF3C7",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#D97706",
        letterSpacing: 0.3,
    },
    errorText: {
        color: Colors.error || "#EF4444",
        fontSize: 12,
        marginTop: 6,
        textAlign: "center",
    },
});
