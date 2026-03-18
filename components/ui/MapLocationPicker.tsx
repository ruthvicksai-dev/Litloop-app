import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

type MapLocationPickerProps = {
    visible: boolean;
    latitude: number;
    longitude: number;
    title?: string;
    subtitle?: string;
    onClose: () => void;
    onConfirm: (coords: { latitude: number; longitude: number }) => void;
};

const DELTA = {
    latitudeDelta: 0.006,
    longitudeDelta: 0.006,
};

export default function MapLocationPicker({
    visible,
    latitude,
    longitude,
    title = "Adjust Location",
    subtitle = "Drag the pin or tap the map to place it exactly.",
    onClose,
    onConfirm,
}: MapLocationPickerProps) {
    const [markerCoords, setMarkerCoords] = useState({ latitude, longitude });
    const [region, setRegion] = useState<Region>({
        latitude,
        longitude,
        ...DELTA,
    });

    useEffect(() => {
        if (!visible) {
            return;
        }

        setMarkerCoords({ latitude, longitude });
        setRegion({
            latitude,
            longitude,
            ...DELTA,
        });
    }, [latitude, longitude, visible]);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Pressable style={styles.iconButton} onPress={onClose}>
                        <Ionicons name="close" size={22} color={Colors.text} />
                    </Pressable>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.subtitle}>{subtitle}</Text>
                    </View>
                </View>

                <View style={styles.mapWrap}>
                    <MapView
                        style={styles.map}
                        initialRegion={region}
                        region={region}
                        onRegionChangeComplete={setRegion}
                        onPress={(event) => {
                            const coords = event.nativeEvent.coordinate;
                            setMarkerCoords(coords);
                            setRegion((current) => ({ ...current, ...coords }));
                        }}
                    >
                        <Marker
                            coordinate={markerCoords}
                            draggable
                            onDragEnd={(event) => {
                                const coords = event.nativeEvent.coordinate;
                                setMarkerCoords(coords);
                                setRegion((current) => ({ ...current, ...coords }));
                            }}
                        />
                    </MapView>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.helperText}>
                        Latitude {markerCoords.latitude.toFixed(5)} • Longitude {markerCoords.longitude.toFixed(5)}
                    </Text>
                    <View style={styles.actions}>
                        <Pressable style={styles.secondaryButton} onPress={onClose}>
                            <Text style={styles.secondaryButtonText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={styles.primaryButton}
                            onPress={() => onConfirm(markerCoords)}
                        >
                            <Text style={styles.primaryButtonText}>Use This Location</Text>
                        </Pressable>
                    </View>
                </View>
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
        alignItems: "flex-start",
        gap: Spacing.md,
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    iconButton: {
        width: Layout.touchSize,
        height: Layout.touchSize,
        borderRadius: Layout.borderRadius,
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: FontSizes.titleLarge,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    subtitle: {
        marginTop: Spacing.xs,
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
    },
    mapWrap: {
        flex: 1,
        marginHorizontal: Layout.screenPaddingWide,
        marginBottom: Spacing.md,
        borderRadius: Layout.cardRadiusLarge,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Colors.border,
    },
    map: {
        flex: 1,
    },
    footer: {
        paddingHorizontal: Layout.screenPaddingWide,
        paddingBottom: Spacing.lg,
    },
    helperText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        textAlign: "center",
        marginBottom: Spacing.md,
    },
    actions: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
    secondaryButton: {
        flex: 1,
        minHeight: Layout.buttonHeight,
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
    },
    secondaryButtonText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    primaryButton: {
        flex: 1.4,
        minHeight: Layout.buttonHeight,
        borderRadius: Layout.borderRadius,
        backgroundColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    primaryButtonText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.white,
    },
});
