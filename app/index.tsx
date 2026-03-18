import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import AppSplash from "@/components/ui/AppSplash";

export default function Index() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (user) {
            router.replace(user.role === "admin" ? "/(admin)/dashboard" : "/(tabs)");
        } else {
            router.replace("/(auth)/sign-in");
        }
    }, [user, isLoading]);

    return <AppSplash />;
}
