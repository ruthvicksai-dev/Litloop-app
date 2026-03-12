import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function Index() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (user) {
            if (user.role === "admin") {
                router.replace("/(admin)/dashboard");
            } else {
                router.replace("/(tabs)");
            }
        } else {
            router.replace("/(auth)/sign-in");
        }
    }, [user, isLoading]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={Colors.primary} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
});
