import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

export default function AdminLayout() {
    const { user, isLoading, isAdmin } = useAuth();
    const router = useRouter();

    // Protect admin routes
    useEffect(() => {
        if (!isLoading && (!user || !isAdmin)) {
            router.replace("/(auth)/sign-in");
        }
    }, [user, isLoading, isAdmin]);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                contentStyle: { backgroundColor: Colors.background },
            }}
        >
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="add-book" />
            <Stack.Screen name="books" />
            <Stack.Screen name="edit-book" />
            <Stack.Screen name="schedule-delivery" />
            <Stack.Screen name="verify-payment" />

        </Stack>
    );
}
