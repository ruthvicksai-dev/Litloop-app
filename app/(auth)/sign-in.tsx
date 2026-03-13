import AuthFooter from "@/components/auth/AuthFooter";
import AuthHeader from "@/components/auth/AuthHeader";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Fonts } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useFadeSlideScaleIn } from "@/hooks/useFadeSlideScaleIn";
import { useSignInScreen } from "@/hooks/useSignInScreen";
import { useRouter } from "expo-router";
import React from "react";
import {
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
                        title="Litloop"
                        subtitle="Sign in to your account"
                        fadeAnim={fadeAnim}
                        slideAnim={slideAnim}
                        scaleAnim={scaleAnim}
                    />

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
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingTop: SCREEN_HEIGHT * 0.08,
        paddingBottom: SCREEN_HEIGHT * 0.04,
        justifyContent: "center",
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
        fontFamily: Fonts.regular,
        textAlign: "center",
        marginBottom: Spacing.md,
    },
});
