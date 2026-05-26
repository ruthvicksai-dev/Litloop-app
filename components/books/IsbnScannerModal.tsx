import Button from "@/components/ui/core/Button";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type IsbnScannerModalProps = {
    visible: boolean;
    onClose: () => void;
    onScanned: (isbn: string) => void;
};

export default function IsbnScannerModal({
    visible,
    onClose,
    onScanned,
}: IsbnScannerModalProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [hasScanned, setHasScanned] = useState(false);

    const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
        const normalized = data.replace(/[-\s]/g, "").trim().toUpperCase();
        if (hasScanned || !/^(97[89]\d{10}|\d{9}[\dX])$/.test(normalized)) {
            return;
        }

        setHasScanned(true);
        onScanned(normalized);
    };

    const handleClose = () => {
        setHasScanned(false);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Scan ISBN</Text>
                    <Button title="Close" onPress={handleClose} variant="ghost" />
                </View>

                {!permission ? (
                    <View style={styles.center}>
                        <Text style={styles.helper}>Checking camera permission...</Text>
                    </View>
                ) : !permission.granted ? (
                    <View style={styles.center}>
                        <Text style={styles.helper}>
                            Camera access is needed to scan the ISBN barcode.
                        </Text>
                        <Button
                            title="Allow Camera"
                            onPress={requestPermission}
                            icon="camera-outline"
                            style={styles.permissionButton}
                        />
                    </View>
                ) : (
                    <View style={styles.scannerWrap}>
                        <CameraView
                            style={styles.camera}
                            facing="back"
                            barcodeScannerSettings={{
                                barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
                            }}
                            onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}
                        />
                        <View style={styles.scanFrame} pointerEvents="none" />
                        <Text style={styles.scanHint}>Align the barcode inside the frame</Text>
                    </View>
                )}
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    title: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.title,
        color: Colors.text,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: Spacing.lg,
    },
    helper: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        textAlign: "center",
    },
    permissionButton: {
        marginTop: Spacing.md,
    },
    scannerWrap: {
        flex: 1,
        overflow: "hidden",
        backgroundColor: Colors.text,
    },
    camera: {
        flex: 1,
    },
    scanFrame: {
        position: "absolute",
        left: "10%",
        right: "10%",
        top: "40%",
        height: 130,
        borderWidth: 2,
        borderColor: Colors.white,
        borderRadius: 8,
    },
    scanHint: {
        position: "absolute",
        left: Spacing.lg,
        right: Spacing.lg,
        bottom: Spacing.xl,
        padding: Spacing.md,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "rgba(0,0,0,0.55)",
        color: Colors.white,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.body,
        textAlign: "center",
    },
});
