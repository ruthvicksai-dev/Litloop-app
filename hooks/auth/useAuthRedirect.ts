import { useEffect, useRef } from "react";
import { Href, useRouter } from "expo-router";

type AuthRedirectUser = {
    _id?: string;
    role?: string;
} | null | undefined;

export function useAuthRedirect(user: AuthRedirectUser) {
    const router = useRouter();
    const redirectedUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!user) {
            redirectedUserIdRef.current = null;
            return;
        }

        const userKey = user._id || "authenticated";
        if (redirectedUserIdRef.current === userKey) {
            return;
        }

        redirectedUserIdRef.current = userKey;
        const target: Href = user.role === "admin" ? "/(admin)/dashboard" : "/(tabs)";
        router.replace(target);
    }, [router, user]);
}
