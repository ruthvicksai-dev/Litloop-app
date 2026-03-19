import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useState } from "react";

function getFriendlySignInError(error: unknown) {
    const rawMessage =
        error instanceof Error ? error.message : "Unable to sign in right now.";

    const normalized = rawMessage.toLowerCase();

    if (normalized.includes("invalid email or password")) {
        return "Incorrect email or password.";
    }

    if (normalized.includes("social login")) {
        return "This account uses Google sign-in. Please continue with Google.";
    }

    if (normalized.includes("too many login attempts")) {
        return "Too many login attempts. Please try again later.";
    }

    if (normalized.includes("email is required")) {
        return "Email is required.";
    }

    if (normalized.includes("password is required")) {
        return "Password is required.";
    }

    return "Unable to sign in. Please try again.";
}

export function useSignInScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { signIn, user } = useAuth();
    const { showToast } = useToast();

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
        } catch (error: unknown) {
            showToast(getFriendlySignInError(error), "error");
        } finally {
            setLoading(false);
        }
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        loading,
        user,
        handleSignIn,
    };
}
