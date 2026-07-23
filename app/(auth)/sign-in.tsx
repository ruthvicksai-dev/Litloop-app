import AuthFooter from "@/components/auth/AuthFooter";
import AuthHeader from "@/components/auth/AuthHeader";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import Button from "@/components/ui/core/Button";
import InputField from "@/components/ui/core/InputField";
import KeyboardAwareScrollView from "@/components/ui/core/KeyboardAwareScrollView";
import LoadingOverlay from "@/components/ui/feedback/LoadingOverlay";
import { isGoogleSignInEnabled } from "@/constants/features";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, scale, Spacing } from "@/constants/theme";
import { useToast } from "@/context/ToastContext";
import { useAuthRedirect, useFadeSlideScaleIn, useSignInScreen } from "@/hooks";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useRouter } from "expo-router";
import React from "react";
import {
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignInScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { fadeAnim, slideAnim, scaleAnim } = useFadeSlideScaleIn({
        slideFrom: 40,
        scaleFrom: 0.5,
        duration: 600,
    });
    const {
        email,
        setEmail,
        password,
        setPassword,
        loading,
        user,
        handleSignIn,
    } = useSignInScreen();

    const { isOnline } = useNetworkStatus();
    const { showToast } = useToast();

    const onSignInPress = () => {
        if (!isOnline) {
            showToast("Internet connection is required to sign in.", "error");
            return;
        }
        handleSignIn();
    };

    useAuthRedirect(user);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.flex}>
                <KeyboardAwareScrollView
                    contentContainerStyle={[
                        styles.container,
                        {
                            paddingTop: scale(28),
                            paddingBottom: Math.max(scale(28), insets.bottom + Spacing.md),
                        },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                >
                    <AuthHeader
                        title="LitLoop"
                        subtitle="Sign in to your account"
                        fadeAnim={fadeAnim}
                        slideAnim={slideAnim}
                        scaleAnim={scaleAnim}
                    />

                    <Text style={styles.formHint} allowFontScaling={false}>
                        Use your email and password to continue.
                    </Text>

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

                        <TouchableOpacity
                            onPress={() => router.push("/(auth)/forgot-password")}
                            style={{ alignSelf: "flex-end", marginTop: Spacing.xs }}
                        >
                            <Text style={styles.linkText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <Button
                            title="Sign In"
                            onPress={onSignInPress}
                            loading={loading}
                            disabled={!isOnline}
                            style={{ marginVertical: Spacing.sm }}
                        />

                        <Text style={styles.termsText}>
                            By continuing, you agree to our{" "}
                            <Text
                                style={styles.linkText}
                                onPress={() => Linking.openURL("https://litloop.in/privacy-policy")}
                            >
                                Privacy Policy
                            </Text>{" "}
                            and{" "}
                            <Text
                                style={styles.linkText}
                                onPress={() => Linking.openURL("https://litloop.in/terms-of-service")}
                            >
                                Terms of Service
                            </Text>
                        </Text>

                        {isGoogleSignInEnabled ? (
                            <>
                                <View style={styles.divider}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText} allowFontScaling={false}>
                                        OR
                                    </Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                <GoogleSignInButton />
                            </>
                        ) : null}
                    </View>

                    <AuthFooter
                        fadeAnim={fadeAnim}
                        prefix="Don't have an account?"
                        linkLabel="Sign Up"
                        onPress={() => router.push("/(auth)/sign-up")}
                    />
                </KeyboardAwareScrollView>
            </View>

            <LoadingOverlay visible={loading} />
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
        paddingHorizontal: Layout.screenPaddingWide,
        justifyContent: "center",
        width: "100%",
        alignSelf: "center",
    },
    form: {
        backgroundColor: Colors.surfaceCard,
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
        marginBottom: Spacing.xl,
        width: "100%",
        maxWidth: Layout.maxContentWidth,
        alignSelf: "center",
    },
    formHint: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        textAlign: "center",
        marginBottom: Spacing.md,
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: Spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border,
        opacity: 0.5,
    },
    dividerText: {
        marginHorizontal: Spacing.md,
        color: Colors.textSecondary,
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
    },
    termsText: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        textAlign: "center",
        lineHeight: 18,
        marginTop: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    linkText: {
        color: Colors.primary,
        fontFamily: Fonts.medium,
        textDecorationLine: "underline",
    },
});
