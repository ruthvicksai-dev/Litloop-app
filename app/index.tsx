import BookLoader from "@/components/ui/BookLoader";
import { Colors } from "@/constants/theme";
import { useRootRedirect } from "@/hooks/useRouteGuards";
import { StyleSheet, View } from "react-native";

export default function Index() {
    useRootRedirect();

    return (
        <View style={styles.container}>
            <BookLoader label="Opening Litloop..." />
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
