import Button from "@/components/ui/core/Button";
import InputField from "@/components/ui/core/InputField";
import LoadingOverlay from "@/components/ui/feedback/LoadingOverlay";
import OtpCodeInput from "@/components/ui/auth/OtpCodeInput";
import PasswordRequirements from "@/components/ui/auth/PasswordRequirements";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, scale, Spacing } from "@/constants/theme";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { maskEmail } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STEPS = ["email", "otp", "newPassword"] as const;
type Step = (typeof STEPS)[number];

export default function ForgotPasswordScreen() {
    const router = useRouter();

    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const { isOnline } = useNetworkStatus();
    const { showToast } = useToast();

    const sendResetOTP = useMutation(api.auth.sendPasswordResetOTP);
    const resetPassword = useMutation(api.auth.resetPasswordWithOTP);

    const currentStepIndex = STEPS.indexOf(step);

    const handleSendOtp = async () => {
        const trimmedEmail = email.toLowerCase().trim();
        if (!trimmedEmail) {
            showToast("Email is required.", "error");
            return;
        }
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            showToast("Invalid email address format.", "error");
            return;
        }

        setLoading(true);
        try {
            await sendResetOTP({ email: trimmedEmail });
            setStep("otp");
            showToast("If an account exists, a reset code was sent to your email.", "success");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to send reset code.";
            showToast(message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpCode.trim() || otpCode.length !== 6) {
            showToast("Please enter a valid 6-digit code.", "error");
            return;
        }
        setStep("newPassword");
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 8) {
            showToast("Password must be at least 8 characters.", "error");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            showToast("Passwords do not match.", "error");
            return;
        }

        setLoading(true);
        try {
            await resetPassword({
                email: email.toLowerCase().trim(),
                otpCode: otpCode.trim(),
                newPassword,
            });
            showToast("Password has been reset successfully! Please sign in.", "success");
            router.replace("/(auth)/sign-in");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Reset failed.";
            showToast(message, "error");
            if (message.includes("verification code") || message.includes("expired")) {
                setStep("otp");
                setOtpCode("");
            }
        } finally {
            setLoading(false);
        }
    };

    const onPrimaryPress = () => {
        if (!isOnline) {
            showToast("Internet connection is required.", "error");
            return;
        }
        if (step === "email") handleSendOtp();
        else if (step === "otp") handleVerifyOtp();
        else handleResetPassword();
    };

    const stepConfig = {
        email: {
            icon: "mail-outline" as const,
            title: "Forgot Password?",
            subtitle: "Enter your email and we'll send you a verification code to reset your password.",
        },
        otp: {
            icon: "shield-checkmark-outline" as const,
            title: "Verify Your Email",
            subtitle: "We've sent a 6-digit code to your email. Enter it below to continue.",
        },
        newPassword: {
            icon: "lock-closed-outline" as const,
            title: "Create New Password",
            subtitle: "Your new password must be at least 8 characters long.",
        },
    };

    const config = stepConfig[step];

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
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            if (step === "otp") { setStep("email"); setOtpCode(""); }
                            else if (step === "newPassword") { setStep("otp"); }
                            else router.back();
                        }}
                    >
                        <Ionicons name="chevron-back" size={22} color={Colors.text} />
                        <Text style={styles.backButtonText}>
                            {step === "email" ? "Back to Sign In" : "Back"}
                        </Text>
                    </TouchableOpacity>

                    {/* Step Indicator */}
                    <View style={styles.stepIndicator}>
                        {STEPS.map((s, i) => (
                            <React.Fragment key={s}>
                                <View
                                    style={[
                                        styles.stepDot,
                                        i <= currentStepIndex && styles.stepDotActive,
                                    ]}
                                >
                                    {i < currentStepIndex ? (
                                        <Ionicons name="checkmark" size={12} color={Colors.white} />
                                    ) : (
                                        <Text style={[
                                            styles.stepDotText,
                                            i <= currentStepIndex && styles.stepDotTextActive,
                                        ]}>
                                            {i + 1}
                                        </Text>
                                    )}
                                </View>
                                {i < STEPS.length - 1 && (
                                    <View
                                        style={[
                                            styles.stepLine,
                                            i < currentStepIndex && styles.stepLineActive,
                                        ]}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </View>

                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name={config.icon} size={32} color={Colors.primary} />
                        </View>
                    </View>

                    {/* Title & Subtitle */}
                    <Text style={styles.title}>{config.title}</Text>
                    <Text style={styles.subtitle}>{config.subtitle}</Text>

                    {/* Form Card */}
                    <View style={styles.form}>
                        {step === "email" && (
                            <>
                                <InputField
                                    label="Email Address"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                <Button
                                    title="Send Verification Code"
                                    onPress={onPrimaryPress}
                                    loading={loading}
                                    disabled={!isOnline}
                                    style={{ marginTop: Spacing.lg }}
                                />
                            </>
                        )}

                        {step === "otp" && (
                            <>
                                <View style={styles.emailBadge}>
                                    <Ionicons name="mail" size={16} color={Colors.primary} />
                                    <Text style={styles.emailBadgeText}>{maskEmail(email)}</Text>
                                </View>
                                <OtpCodeInput
                                    label="Verification Code"
                                    value={otpCode}
                                    onChange={(text) => setOtpCode(text.replace(/[^0-9]/g, "").slice(0, 6))}
                                    autoFocus
                                />
                                <Button
                                    title="Verify Code"
                                    onPress={onPrimaryPress}
                                    loading={loading}
                                    disabled={!isOnline || otpCode.length !== 6}
                                    style={{ marginTop: Spacing.lg }}
                                />
                                <TouchableOpacity
                                    style={styles.resendLink}
                                    onPress={() => {
                                        setStep("email");
                                        setOtpCode("");
                                    }}
                                >
                                    <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
                                    <Text style={styles.resendText}>Resend code</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {step === "newPassword" && (
                            <>
                                <InputField
                                    label="New Password"
                                    placeholder="Minimum 8 characters"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                />
                                <PasswordRequirements password={newPassword} />
                                <InputField
                                    label="Confirm New Password"
                                    placeholder="Re-enter your password"
                                    value={confirmNewPassword}
                                    onChangeText={setConfirmNewPassword}
                                    secureTextEntry
                                    showPasswordToggle={false}
                                />
                                <Button
                                    title="Reset Password"
                                    onPress={onPrimaryPress}
                                    loading={loading}
                                    disabled={!isOnline}
                                    style={{ marginTop: Spacing.lg }}
                                />
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

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
        paddingTop: scale(24),
        paddingBottom: scale(28),
        width: "100%",
        alignSelf: "center",
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
        marginBottom: Spacing.xl,
        alignSelf: "flex-start",
    },
    backButtonText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },

    // Step Indicator
    stepIndicator: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.xl,
    },
    stepDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    stepDotActive: {
        backgroundColor: Colors.primary,
    },
    stepDotText: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
    },
    stepDotTextActive: {
        color: Colors.white,
    },
    stepLine: {
        width: scale(40),
        height: 2,
        backgroundColor: Colors.border,
        marginHorizontal: Spacing.xs,
    },
    stepLineActive: {
        backgroundColor: Colors.primary,
    },

    // Icon
    iconContainer: {
        alignItems: "center",
        marginBottom: Spacing.md,
    },
    iconCircle: {
        width: scale(64),
        height: scale(64),
        borderRadius: scale(32),
        backgroundColor: `${Colors.primary}15`,
        alignItems: "center",
        justifyContent: "center",
    },

    // Text
    title: {
        fontSize: scale(24),
        fontFamily: Fonts.bold,
        color: Colors.text,
        textAlign: "center",
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        textAlign: "center",
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.md,
        lineHeight: 20,
    },

    // Form Card
    form: {
        backgroundColor: Colors.white,
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.lg,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
        elevation: 3,
        width: "100%",
        maxWidth: Layout.maxContentWidth,
        alignSelf: "center",
    },
    emailBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
        backgroundColor: `${Colors.primary}10`,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: 8,
        marginBottom: Spacing.lg,
        alignSelf: "center",
    },
    emailBadgeText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.primary,
    },
    resendLink: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.xs,
        marginTop: Spacing.lg,
    },
    resendText: {
        color: Colors.primary,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.body,
    },
});
