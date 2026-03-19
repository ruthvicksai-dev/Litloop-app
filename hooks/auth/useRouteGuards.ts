import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export function useRootRedirect() {
    const { user, isLoading, isRefreshing } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Never redirect while auth is loading or a silent token refresh is in progress
        if (isLoading || isRefreshing) return;

        if (user) {
            router.replace(user.role === "admin" ? "/(admin)/dashboard" : "/(tabs)");
            return;
        }

        router.replace("/(tabs)");
    }, [isLoading, isRefreshing, router, user]);
}

export function useTabsRouteGuard() {
    const { user, isLoading, isRefreshing } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Never redirect while auth is loading or a silent token refresh is in progress
        if (isLoading || isRefreshing) return;

        if (user && user.role === "admin") {
            router.replace("/(admin)/dashboard");
        }
        // No redirect for guests (!user); they can stay in the tabs
    }, [isLoading, isRefreshing, router, user]);
}

export function useAdminRouteGuard() {
    const { user, isLoading, isAdmin, isRefreshing } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Never redirect while auth is loading or a silent token refresh is in progress
        if (isLoading || isRefreshing) return;

        if (!user || !isAdmin) {
            router.replace("/(auth)/sign-in");
        }
    }, [isAdmin, isLoading, isRefreshing, router, user]);
}
