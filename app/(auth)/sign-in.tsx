import AuthFooter from "@/components/auth/AuthFooter";
import AuthHeader from "@/components/auth/AuthHeader";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, scale, Spacing } from "@/constants/theme";
import { useAuthRedirect, useFadeSlideScaleIn, useSignInScreen } from "@/hooks";
import { useRouter } from "expo-router";
import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInScreen() {
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

    useAuthRedirect(user);

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
                    <AuthHeader
                        title="Lit Loop"
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

                        <Button
                            title="Sign In"
                            onPress={handleSignIn}
                            loading={loading}
                            style={{ marginTop: Spacing.md }}
                        />

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText} allowFontScaling={false}>
                                OR
                            </Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <GoogleSignInButton />
                    </View>

                    <AuthFooter
                        fadeAnim={fadeAnim}
                        prefix="Don't have an account?"
                        linkLabel="Sign Up"
                        onPress={() => router.push("/(auth)/sign-up")}
                    />
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
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: scale(40),
        paddingBottom: scale(28),
        justifyContent: "center",
        width: "100%",
        alignSelf: "center",
    },
    form: {
        backgroundColor: Colors.white,
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.lg,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 4,
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
});
