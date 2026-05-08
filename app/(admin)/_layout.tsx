import { Colors } from "@/constants/theme";
import { useAdminRouteGuard } from "@/hooks";
import { Stack } from "expo-router";

export default function AdminLayout() {
    useAdminRouteGuard();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                contentStyle: { backgroundColor: Colors.background },
            }}
        >
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="analytics" />
            <Stack.Screen name="revenue" />
            <Stack.Screen name="add-book" />
            <Stack.Screen name="books" />
            <Stack.Screen name="book-details" />
            <Stack.Screen name="edit-book" />
            <Stack.Screen name="schedule-delivery" />
            <Stack.Screen name="verify-payment" />
            <Stack.Screen name="payment-settings" />
            <Stack.Screen name="notifications" />
        </Stack>
    );
}
