import AuthFooter from "@/components/auth/AuthFooter";
import AuthHeader from "@/components/auth/AuthHeader";
import Button from "@/components/ui/core/Button";
import InputField from "@/components/ui/core/InputField";
import OtpCodeInput from "@/components/ui/auth/OtpCodeInput";
import PasswordRequirements from "@/components/ui/auth/PasswordRequirements";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, scale, Spacing } from "@/constants/theme";
import { useToast } from "@/context/ToastContext";
import { useAuthRedirect, useFadeSlideScaleIn, useSignUpScreen } from "@/hooks";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { maskEmail } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUpScreen() {
    const router = useRouter();
    const { fadeAnim, slideAnim, scaleAnim } = useFadeSlideScaleIn({
        slideFrom: 40,
        scaleFrom: 0.5,
        duration: 600,
    });
    const {
        step,
        setStep,
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
        agreedToTerms,
        setAgreedToTerms,
        otpCode,
        setOtpCode,
        loading,
        user,
        handleSendOtp,
        handleVerifyOtp,
    } = useSignUpScreen();

    const { isOnline } = useNetworkStatus();
    const { showToast } = useToast();

    const onSignUpPress = () => {
        if (!isOnline) {
            showToast("Internet connection is required to sign up.", "error");
            return;
        }
        if (step === "details") {
            handleSendOtp();
        } else {
            handleVerifyOtp();
        }
    };

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

                    <Text style={styles.formHint} allowFontScaling={false}>
                        Create your account to start requesting books.
                    </Text>

                    <View style={styles.form}>
                        {step === "details" ? (
                            <>
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
                                <PasswordRequirements password={password} />
                                <InputField
                                    label="Confirm Password"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />

                                <TouchableOpacity
                                    style={styles.checkboxContainer}
                                    onPress={() => setAgreedToTerms(!agreedToTerms)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={agreedToTerms ? "checkbox" : "square-outline"}
                                        size={22}
                                        color={agreedToTerms ? Colors.primary : Colors.textSecondary}
                                    />
                                    <Text style={styles.checkboxLabel}>
                                        I agree to the{" "}
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
                                </TouchableOpacity>

                                <Button
                                    title="Send OTP"
                                    onPress={onSignUpPress}
                                    loading={loading}
                                    disabled={!isOnline}
                                    style={{ marginTop: Spacing.md }}
                                />
                            </>
                        ) : (
                            <>
                                <Text style={[styles.formHint, { color: Colors.text }]}>
                                    Please enter the 6-digit code we sent to your email address:
                                </Text>
                                <Text style={[styles.formHint, { color: Colors.primary, marginBottom: Spacing.lg, fontWeight: "600" }]}>
                                    {maskEmail(email)}
                                </Text>
                                <OtpCodeInput
                                    label="Verification Code"
                                    value={otpCode}
                                    onChange={(text) => setOtpCode(text.replace(/[^0-9]/g, "").slice(0, 6))}
                                    autoFocus
                                />
                                <Button
                                    title="Verify & Create Account"
                                    onPress={onSignUpPress}
                                    loading={loading}
                                    disabled={!isOnline || otpCode.length !== 6}
                                    style={{ marginTop: Spacing.md }}
                                />
                                <TouchableOpacity
                                    style={{ alignItems: "center", marginTop: Spacing.lg }}
                                    onPress={() => setStep("details")}
                                >
                                    <Text style={{ color: Colors.textSecondary, fontFamily: Fonts.medium }}>
                                        Cancel and edit details
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
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
    checkboxContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: Spacing.sm,
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.xs,
        gap: Spacing.sm,
    },
    checkboxLabel: {
        flex: 1,
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        lineHeight: 20,
    },
    linkText: {
        color: Colors.primary,
        fontFamily: Fonts.medium,
        textDecorationLine: "underline",
    },
});
