import BookLoader from "@/components/ui/BookLoader";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import MapLocationPicker from "@/components/ui/MapLocationPicker";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, FEATURE_FLAGS, Spacing, ZONES } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useFadeSlideIn, useRequestRentalScreen } from "@/hooks";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GuestView } from "../profile/GuestProfileView";

interface RentalRequestModalProps {
    visible: boolean;
    onClose: () => void;
    bookId: string;
}

export default function RentalRequestModal({
    visible,
    onClose,
    bookId,
}: RentalRequestModalProps) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { fadeAnim, slideAnim } = useFadeSlideIn();
    const {
        book,
        zone,
        setZone,
        landmark,
        setLandmark,
        phone,
        setPhone,
        roomNo,
        setRoomNo,
        yearOfStudy,
        setYearOfStudy,
        department,
        setDepartment,
        rollNo,
        setRollNo,
        latitude,
        setLatitude,
        longitude,
        setLongitude,
        formattedAddress,
        setFormattedAddress,
        loading,
        handleRequest,
    } = useRequestRentalScreen(bookId);

    const { showToast } = useToast();
    const [isLocating, setIsLocating] = useState(false);
    const [isMapPickerVisible, setIsMapPickerVisible] = useState(false);

    const updateAddressFromCoords = async (nextLatitude: number, nextLongitude: number) => {
        setLatitude(nextLatitude);
        setLongitude(nextLongitude);

        try {
            console.log(`[Location] Reverse geocoding for: ${nextLatitude}, ${nextLongitude}`);
            const address = await Location.reverseGeocodeAsync({
                latitude: nextLatitude,
                longitude: nextLongitude,
            });

            if (address && address.length > 0) {
                const addr = address[0];
                console.log("[Location] Reverse geocode success:", addr);
                const fullAddress = [
                    addr.name,
                    addr.street,
                    addr.district,
                    addr.city,
                    addr.region,
                    addr.postalCode,
                ]
                    .filter(Boolean)
                    .join(", ");
                setFormattedAddress(fullAddress);
            } else {
                console.warn("[Location] No address results found.");
            }
        } catch (error) {
            console.error("[Location] Reverse geocode error:", error);
            throw error;
        }
    };

    const handleGetLocation = async () => {
        setIsLocating(true);
        try {
            console.log("[Location] Checking if services are enabled...");
            const enabled = await Location.hasServicesEnabledAsync();
            if (!enabled) {
                console.warn("[Location] Location services are disabled on device.");
                showToast("Please enable location services in your device settings.", "error");
                return;
            }

            console.log("[Location] Requesting permissions...");
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                console.warn("[Location] Permission denied.");
                showToast("Permission to access location was denied", "error");
                return;
            }

            console.log("[Location] Attempting to get last known position...");
            let location = await Location.getLastKnownPositionAsync({});

            if (!location) {
                console.log("[Location] No last known position. Fetching current position (this may take a moment)...");
                location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
            }

            if (location) {
                console.log("[Location] Position received:", location.coords);
                await updateAddressFromCoords(
                    location.coords.latitude,
                    location.coords.longitude
                );
                showToast("Location updated!", "success");
            } else {
                throw new Error("Could not determine location.");
            }
        } catch (error) {
            console.error("[Location] handleGetLocation error:", error);
            showToast("Failed to fetch location. Please ensure GPS is on and try again.", "error");
        } finally {
            setIsLocating(false);
        }
    };

    const onFormSubmit = async () => {
        await handleRequest();
        // Hook internal handles navigation on success, but we should also close modal 
        // if we want to stay on the same screen (not the case for Litloop's current flow)
        // However, if we stay on current screen, we should call onClose().
    };

    const renderContent = () => {
        if (isAuthLoading) {
            return (
                <View style={styles.center}>
                    <BookLoader label="Authenticating..." />
                </View>
            );
        }

        if (!user) {
            return (
                <GuestView
                    title="Sign in to rent books"
                    subtitle="You need an active account to request a book rental. Sign in now to continue!"
                    headerTitle="Rent Book"
                    icon="book-outline"
                    showBackButton={true}
                />
            );
        }

        if (book === undefined) {
            return (
                <View style={styles.center}>
                    <BookLoader label="Loading details..." />
                </View>
            );
        }

        return (
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }}
                    >
                        <Text style={styles.sectionTitle}>Delivery Zone</Text>
                        <View style={styles.zoneGrid}>
                            {ZONES.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.zoneChip,
                                        zone === item && styles.zoneChipActive,
                                    ]}
                                    onPress={() => setZone(item)}
                                >
                                    <Text
                                        style={[
                                            styles.zoneChipText,
                                            zone === item && styles.zoneChipTextActive,
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.sectionTitle}>Delivery Details</Text>

                        {zone === "College" && (
                            <View style={styles.infoBox}>
                                <Ionicons name="information-circle" size={18} color={Colors.primary} />
                                <Text style={styles.infoText}>
                                    Note: Deliveries are only applicable to KITS college vinjanampadu.
                                </Text>
                            </View>
                        )}

                        {zone === "College" ? (
                            <>
                                <InputField
                                    label="Room No"
                                    placeholder="e.g. 205"
                                    value={roomNo}
                                    onChangeText={setRoomNo}
                                />
                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: Spacing.sm }}>
                                        <InputField
                                            label="Year of Study"
                                            placeholder="e.g. 3rd"
                                            value={yearOfStudy}
                                            onChangeText={setYearOfStudy}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <InputField
                                            label="Department"
                                            placeholder="e.g. CSE"
                                            value={department}
                                            onChangeText={setDepartment}
                                        />
                                    </View>
                                </View>
                                <InputField
                                    label="Roll No"
                                    placeholder="e.g. 21K61A0501"
                                    value={rollNo}
                                    onChangeText={setRollNo}
                                />
                            </>
                        ) : zone === "Home" ? (
                            <>
                                <TouchableOpacity
                                    style={styles.locationBtn}
                                    onPress={handleGetLocation}
                                    disabled={isLocating}
                                >
                                    <View style={styles.locationBtnContent}>
                                        {isLocating ? (
                                            <ActivityIndicator size="small" color={Colors.primary} />
                                        ) : (
                                            <Ionicons name="location" size={20} color={Colors.primary} />
                                        )}
                                        <Text style={styles.locationBtnText}>
                                            {isLocating ? "Locating..." : "Use Current Location"}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {formattedAddress ? (
                                    <View style={styles.addressDisplay}>
                                        <Text style={styles.addressLabel}>Selected Address:</Text>
                                        <Text style={styles.addressText}>{formattedAddress}</Text>
                                        <Text style={styles.coordsText}>
                                            Lat: {latitude?.toFixed(4)}, Lng: {longitude?.toFixed(4)}
                                        </Text>
                                        {FEATURE_FLAGS.enableMapAdjustment && latitude !== undefined && longitude !== undefined ? (
                                            <TouchableOpacity
                                                style={styles.adjustLocationButton}
                                                onPress={() => setIsMapPickerVisible(true)}
                                            >
                                                <Ionicons
                                                    name="map-outline"
                                                    size={16}
                                                    color={Colors.primary}
                                                />
                                                <Text style={styles.adjustLocationText}>
                                                    Adjust on map
                                                </Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                ) : null}

                                <InputField
                                    label="Street Address / Landmark"
                                    placeholder="e.g. Near Ramalayam Temple"
                                    value={landmark}
                                    onChangeText={setLandmark}
                                />
                            </>
                        ) : (
                            <Text style={styles.placeholderText}>Please select a zone to enter address details.</Text>
                        )}

                        <InputField
                            label="Phone Number"
                            placeholder="Your contact number"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />

                        <Button
                            title="Submit Request"
                            onPress={onFormSubmit}
                            loading={loading}
                            style={{ marginTop: Spacing.md }}
                        />
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Request Rental</Text>
                        {book ? (
                            <Text style={styles.bookInfo} numberOfLines={1}>
                                {book.title}
                            </Text>
                        ) : null}
                    </View>
                </View>

                {renderContent()}

                {/* Sub-modal for map location adjustment */}
                {FEATURE_FLAGS.enableMapAdjustment && isMapPickerVisible && latitude !== undefined && longitude !== undefined ? (
                    <MapLocationPicker
                        visible={isMapPickerVisible}
                        latitude={latitude}
                        longitude={longitude}
                        title="Adjust Delivery Location"
                        subtitle="Drag the pin or tap the map, then confirm the exact delivery point."
                        onClose={() => setIsMapPickerVisible(false)}
                        onConfirm={async (coords) => {
                            try {
                                await updateAddressFromCoords(coords.latitude, coords.longitude);
                                showToast("Location adjusted successfully!", "success");
                            } catch {
                                showToast("Failed to update the selected location.", "error");
                            } finally {
                                setIsMapPickerVisible(false);
                            }
                        }}
                    />
                ) : null}
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    flex: {
        flex: 1,
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: Spacing.sm,
        paddingBottom: 28,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        paddingHorizontal: 20,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border + "40",
    },
    closeBtn: {
        padding: 4,
        marginLeft: -4,
    },
    headerText: {
        flex: 1,
    },
    row: {
        flexDirection: "row",
    },
    infoBox: {
        flexDirection: "row",
        backgroundColor: Colors.primary + "10",
        padding: Spacing.sm,
        borderRadius: 12,
        marginBottom: Spacing.md,
        alignItems: "center",
    },
    infoText: {
        flex: 1,
        fontSize: FontSizes.small,
        color: Colors.primary,
        fontFamily: Fonts.medium,
        marginLeft: 8,
    },
    locationBtn: {
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        backgroundColor: Colors.white,
    },
    locationBtnContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    locationBtnText: {
        color: Colors.primary,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.body,
        marginLeft: 8,
    },
    addressDisplay: {
        backgroundColor: Colors.border + "20",
        padding: Spacing.md,
        borderRadius: 12,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    addressLabel: {
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        marginBottom: 4,
    },
    addressText: {
        fontSize: FontSizes.body,
        color: Colors.text,
        fontFamily: Fonts.regular,
        marginBottom: 4,
    },
    coordsText: {
        fontSize: 10,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
    adjustLocationButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 6,
        marginTop: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 999,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.primary + "30",
    },
    adjustLocationText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.primary,
    },
    placeholderText: {
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        textAlign: "center",
        marginVertical: Spacing.xl,
    },
    title: {
        fontSize: FontSizes.title,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    bookInfo: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        marginTop: 2,
        fontFamily: Fonts.regular,
    },
    sectionTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
        marginTop: Spacing.sm,
    },
    zoneGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    zoneChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
    },
    zoneChipActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary,
    },
    zoneChipText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    zoneChipTextActive: {
        color: Colors.white,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
});
