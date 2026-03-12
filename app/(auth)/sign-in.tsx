import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function SignInScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { signIn, user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    // Navigate reactively once user is populated
    useEffect(() => {
        if (user) {
            if (user.role === "admin") {
                router.replace("/(admin)/dashboard");
            } else {
                router.replace("/(tabs)");
            }
        }
    }, [user]);

    // Entrance animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const logoScale = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
                toValue: 1,
                friction: 4,
                tension: 60,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleSignIn = async () => {
        if (!email.trim()) {
            showToast("Email is required.", "error");
            return;
        }
        if (!password) {
            showToast("Password is required.", "error");
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
            showToast("Welcome back!", "success");
        } catch (error: any) {
            showToast(error.message || "Sign in failed.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <Animated.View
                        style={[
                            styles.header,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            },
                        ]}
                    >
                        <Animated.Text
                            style={[
                                styles.logo,
                                { transform: [{ scale: logoScale }] },
                            ]}
                        >
                            📚
                        </Animated.Text>
                        <Text style={styles.title}>Litloop</Text>
                        <Text style={styles.subtitle}>
                            Sign in to your account
                        </Text>
                    </Animated.View>

                    <Text style={styles.formHint}>Use your email and password to continue.</Text>

                    <View style={styles.form}>
                        <InputField
                            label="Email"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <InputField
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <Button
                            title="Sign In"
                            onPress={handleSignIn}
                            loading={loading}
                            style={{ marginTop: Spacing.md }}
                        />
                    </View>

                    <Animated.View
                        style={[styles.footer, { opacity: fadeAnim }]}
                    >
                        <Text style={styles.footerText}>
                            Don't have an account?{" "}
                        </Text>
                        <Text
                            style={styles.link}
                            onPress={() => router.push("/(auth)/sign-up")}
                        >
                            Sign Up
                        </Text>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    flex: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingTop: SCREEN_HEIGHT * 0.08,
        paddingBottom: SCREEN_HEIGHT * 0.04,
        justifyContent: "center",
    },
    header: {
        alignItems: "center",
        marginBottom: SCREEN_HEIGHT * 0.04,
    },
    logo: {
        fontSize: SCREEN_WIDTH * 0.14,
        marginBottom: Spacing.sm,
    },
    title: {
        fontSize: SCREEN_WIDTH * 0.08,
        fontWeight: "800",
        color: Colors.primary,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: SCREEN_WIDTH * 0.04,
        color: Colors.textSecondary,
    },
    form: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: Spacing.lg,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 4,
        marginBottom: Spacing.xl,
    },
    formHint: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: "center",
        marginBottom: Spacing.md,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    footerText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    link: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: "600",
    },
});
