import { useAuthActions, useAuthState } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getPhoneValidationError, normalizePhoneNumber } from "@/utils";
import { useState } from "react";

export function useSignUpScreen() {
    const [step, setStep] = useState<"details" | "otp">("details");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // OTP Specific
    const [otpCode, setOtpCode] = useState("");

    const [loading, setLoading] = useState(false);
    const [accountExistsError, setAccountExistsError] = useState(false);
    const { sendOtp, verifyOtp } = useAuthActions();
    const { user } = useAuthState();
    const { showToast } = useToast();

    const handleSendOtp = async () => {
        const trimmedName = name.trim();
        const trimmedEmail = email.toLowerCase().trim();

        if (!trimmedName) {
            showToast("Name is required.", "error");
            return;
        }
        if (!/^[a-zA-Z\s\-']{2,100}$/.test(trimmedName)) {
            showToast("Name can only contain letters, spaces, hyphens, and apostrophes (2-100 chars).", "error");
            return;
        }

        if (!trimmedEmail) {
            showToast("Email is required.", "error");
            return;
        }
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            showToast("Invalid email address format.", "error");
            return;
        }

        const phoneError = getPhoneValidationError(phone);
        if (phoneError) {
            showToast(phoneError, "error");
            return;
        }

        if (password.length < 8) {
            showToast("Password must be at least 8 characters.", "error");
            return;
        }
        if (password !== confirmPassword) {
            showToast("Passwords do not match.", "error");
            return;
        }
        if (!agreedToTerms) {
            showToast("Please agree to the Privacy Policy and Terms of Service to continue", "error");
            return;
        }

        setLoading(true);
        try {
            await sendOtp(trimmedName, trimmedEmail, normalizePhoneNumber(phone), password, agreedToTerms);
            setStep("otp");
            showToast("A verification code was sent to your email.", "success");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Sign up failed.";
            if (message.includes("User is already registered. Please sign in.")) {
                setAccountExistsError(true);
            } else {
                showToast(message, "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpCode.trim() || otpCode.length !== 6) {
            showToast("Please enter a valid 6-digit code.", "error");
            return;
        }

        setLoading(true);
        try {
            await verifyOtp(email.toLowerCase().trim(), otpCode.trim());
            showToast("Account verified successfully!", "success");
            // Auth context will redirect user
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Verification failed.";
            showToast(message, "error");
        } finally {
            setLoading(false);
        }
    };

    return {
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
        accountExistsError,
        setAccountExistsError,
        user,
        handleSendOtp,
        handleVerifyOtp,
    };
}
