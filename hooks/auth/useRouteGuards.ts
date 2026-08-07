import { useAuthState } from "@/context/AuthContext";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef } from "react";

export function useRootRedirect() {
    const { user, isLoading, isRefreshing } = useAuthState();
    const router = useRouter();
    const redirectedUserRef = useRef<string | null>(null);

    useEffect(() => {
        // Never redirect while auth is loading or a silent token refresh is in progress
        if (isLoading || isRefreshing) return;

        if (user) {
            const userKey = user._id || "authenticated";
            if (redirectedUserRef.current === userKey) return;
            redirectedUserRef.current = userKey;
            router.replace(user.role === "admin" ? "/(admin)/dashboard" : "/(tabs)");
            return;
        }

        router.replace("/(tabs)");
    }, [isLoading, isRefreshing, router, user]);
}

/**
 * Keeps admin accounts out of the customer tab shell after session hydration.
 * Guest users intentionally remain in tabs because browsing is allowed.
 */
export function useTabsRouteGuard() {
    const { user, isLoading, isRefreshing } = useAuthState();
    const router = useRouter();
    const redirectedAdminRef = useRef<string | null>(null);

    useEffect(() => {
        // Never redirect while auth is loading or a silent token refresh is in progress
        if (isLoading || isRefreshing) return;

        if (!user) {
            redirectedAdminRef.current = null;
            return;
        }

        if (user && user.role === "admin") {
            const userKey = user._id || "admin";
            if (redirectedAdminRef.current === userKey) return;
            redirectedAdminRef.current = userKey;
            router.replace("/(admin)/dashboard");
        }
        // No redirect for guests (!user); they can stay in the tabs
    }, [isLoading, isRefreshing, router, user]);
}

/**
 * Protects the admin route group at the navigation layer.
 * Convex functions still perform the authoritative server-side admin checks.
 */
export function useAdminRouteGuard() {
    const { user, isLoading, isAdmin, isRefreshing } = useAuthState();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Never redirect while auth is loading or a silent token refresh is in progress
        if (isLoading || isRefreshing) return;

        if (!user || !isAdmin) {
            if (pathname.startsWith("/(admin)")) {
                router.replace("/(tabs)");
            }
        }
    }, [isAdmin, isLoading, isRefreshing, pathname, router, user]);
}
