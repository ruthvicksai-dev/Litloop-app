import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export function useRootRedirect() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (user) {
            router.replace(user.role === "admin" ? "/(admin)/dashboard" : "/(tabs)");
            return;
        }

        router.replace("/(auth)/sign-in");
    }, [isLoading, router, user]);
}

export function useTabsRouteGuard() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (!user) {
            router.replace("/(auth)/sign-in");
        } else if (user.role === "admin") {
            router.replace("/(admin)/dashboard");
        }
    }, [isLoading, router, user]);
}

export function useAdminRouteGuard() {
    const { user, isLoading, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || !isAdmin)) {
            router.replace("/(auth)/sign-in");
        }
    }, [isAdmin, isLoading, router, user]);
}
