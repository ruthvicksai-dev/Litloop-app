import AdminHeader from "@/components/admin/core/AdminHeader";
import Button from "@/components/ui/core/Button";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useScanBookScreen } from "@/hooks";
import type { ScanBookParams } from "@/hooks/admin/useScanBookScreen";
import { BarcodeScanningResult, CameraView } from "expo-camera";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanBookPage() {
    const params = useLocalSearchParams<ScanBookParams>();
    const {
        permission,
        requestPermission,
        hasScanned,
        handleBarcodeScanned,
        handleTryAnotherMethod,
    } = useScanBookScreen(params);

    const onBarcodeScanned = (result: BarcodeScanningResult) => {
        void handleBarcodeScanned(result.data);
    };

    return (
        <SafeAreaView style={styles.container}>
            <AdminHeader title="Scan ISBN" />

            {!permission ? (
                <View style={styles.center}>
                    <Text style={styles.helper}>
                        Checking camera permission...
                    </Text>
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
                            barcodeTypes: [
                                "ean13",
                                "ean8",
                                "upc_a",
                                "upc_e",
                            ],
                        }}
                        onBarcodeScanned={
                            hasScanned ? undefined : onBarcodeScanned
                        }
                    />
                    <View style={styles.scanFrame} pointerEvents="none" />
                    <Text style={styles.scanHint}>
                        Align the barcode inside the frame
                    </Text>
                </View>
            )}

            <View style={styles.footer}>
                <Button
                    title="Try Another Method"
                    onPress={handleTryAnotherMethod}
                    variant="ghost"
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
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
    footer: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
});
