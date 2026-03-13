import { Colors } from "@/constants/theme";
import { useRootRedirect } from "@/hooks/useRouteGuards";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function Index() {
    useRootRedirect();

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
