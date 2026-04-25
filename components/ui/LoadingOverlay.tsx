import { Colors } from "@/constants/theme";
import React from "react";
import { ActivityIndicator, Modal, StyleSheet, View } from "react-native";

type LoadingOverlayProps = {
    visible: boolean;
};

export default function LoadingOverlay({ visible }: LoadingOverlayProps) {
    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <ActivityIndicator size="large" color={Colors.white} />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
    },
});
