import { useEffect } from "react";
import { Href, useRouter } from "expo-router";

type AuthRedirectUser = {
    role?: string;
} | null | undefined;

export function useAuthRedirect(user: AuthRedirectUser) {
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            return;
        }

        const target: Href = user.role === "admin" ? "/(admin)/dashboard" : "/(tabs)";
        router.replace(target);
    }, [router, user]);
}
