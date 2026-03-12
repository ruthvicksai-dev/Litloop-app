import { Colors } from "@/constants/theme";
import { Stack } from "expo-router";

export default function RentalLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                contentStyle: { backgroundColor: Colors.background },
            }}
        >
            <Stack.Screen name="request" />
            <Stack.Screen name="schedule-return" />
            <Stack.Screen name="payment" />
        </Stack>
    );
}
