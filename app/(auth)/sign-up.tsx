import AuthFooter from "@/components/auth/AuthFooter";
import AuthHeader from "@/components/auth/AuthHeader";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";
import { useAuthRedirect, useFadeSlideScaleIn, useSignUpScreen } from "@/hooks";
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
import { Fonts, FontSizes } from "@/constants/fonts";

export default function SignUpScreen() {
    const router = useRouter();
    const { fadeAnim, slideAnim, scaleAnim } = useFadeSlideScaleIn({
        slideFrom: 40,
        scaleFrom: 0.5,
        duration: 600,
    });
    const {
        name,
        setName,
        email,
        setEmail,
        phone,
        setPhone,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        loading,
        user,
        handleSignUp,
    } = useSignUpScreen();

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
                        title="Create Account"
                        subtitle="Join Litloop today"
                        fadeAnim={fadeAnim}
                        slideAnim={slideAnim}
                        scaleAnim={scaleAnim}
                    />

                    <Text style={styles.formHint}>Create your account to start requesting books.</Text>

                    <View style={styles.form}>
                        <InputField
                            label="Full Name"
                            placeholder="Enter your full name"
                            value={name}
                            onChangeText={setName}
                        />
                        <InputField
                            label="Email"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <InputField
                            label="Phone Number"
                            placeholder="Enter your phone number"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                        <InputField
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        <InputField
                            label="Confirm Password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />

                        <Button
                            title="Sign Up"
                            onPress={handleSignUp}
                            loading={loading}
                            style={{ marginTop: Spacing.md }}
                        />
                    </View>

                    <AuthFooter
                        fadeAnim={fadeAnim}
                        prefix="Already have an account?"
                        linkLabel="Sign In"
                        onPress={() => router.push("/(auth)/sign-in")}
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
        paddingTop: scale(32),
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
        marginBottom: Spacing.lg,
        width: "100%",
        maxWidth: Layout.maxContentWidth,
        alignSelf: "center",
    },
    formHint: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        textAlign: "center",
        marginBottom: Spacing.md,
        fontFamily: Fonts.regular,
    },
});
