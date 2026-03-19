import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import AppSplash from "@/components/ui/AppSplash";
import { useToast } from "@/context/ToastContext";

export default function Index() {
    const { user, isLoading, consumePendingAuthToast } = useAuth();
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
            router.replace("/(auth)/sign-in");
        }
    }, [user, isLoading, consumePendingAuthToast, router, showToast]);

    return <AppSplash />;
}
