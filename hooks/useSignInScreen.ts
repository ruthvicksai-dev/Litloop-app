import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useState } from "react";

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
            showToast("Welcome back!", "success");
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Sign in failed.";
            showToast(message, "error");
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
