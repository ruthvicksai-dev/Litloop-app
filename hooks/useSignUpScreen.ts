import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useState } from "react";

export function useSignUpScreen() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { signUp, user } = useAuth();
    const { showToast } = useToast();

    const handleSignUp = async () => {
        if (!name.trim()) {
            showToast("Name is required.", "error");
            return;
        }
        if (!email.trim()) {
            showToast("Email is required.", "error");
            return;
        }
        if (!phone.trim()) {
            showToast("Phone number is required.", "error");
            return;
        }
        if (password.length < 6) {
            showToast("Password must be at least 6 characters.", "error");
            return;
        }
        if (password !== confirmPassword) {
            showToast("Passwords do not match.", "error");
            return;
        }

        setLoading(true);
        try {
            await signUp(name, email, phone, password);
            showToast("Account created successfully!", "success");
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Sign up failed.";
            showToast(message, "error");
        } finally {
            setLoading(false);
        }
    };

    return {
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
    };
}
