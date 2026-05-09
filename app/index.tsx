import AppSplash from "@/components/ui/AppSplash";
import { useAuthActions, useAuthState } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Index() {
    const { user, isLoading } = useAuthState();
    const { consumePendingAuthToast } = useAuthActions();
    const { showToast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (user) {
            const pendingToast = consumePendingAuthToast();
            if (pendingToast) {
                showToast(pendingToast.message, pendingToast.type);
            }
            router.replace(user.role === "admin" ? "/(admin)/dashboard" : "/(tabs)");
        } else {
            router.replace("/(tabs)");
        }
    }, [user, isLoading, consumePendingAuthToast, router, showToast]);

    return <AppSplash />;
}
