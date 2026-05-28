import RentalRequestForm from "@/components/rental/RentalRequestForm";
import { GuestView } from "@/components/profile/GuestProfileView";
import BookLoader from "@/components/ui/feedback/BookLoader";
import ConfirmActionModal from "@/components/ui/feedback/ConfirmActionModal";
import MapLocationPicker from "@/components/ui/pickers/MapLocationPicker";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, FEATURE_FLAGS } from "@/constants/theme";
import { useAuthState } from "@/context/AuthContext";
import { useToast, ToastProvider } from "@/context/ToastContext";
import { useFadeSlideIn, useRequestRentalScreen, usePreviousAddresses } from "@/hooks";
import { AddressTemplate } from "@/components/rental/form/PreviousAddressCard";
import { 
    getReliableCurrentLocation,
    resolveDeliveryAreaFromLocation,
    validateDeliveryAreaSelection,
} from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { BackHandler, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface RentalRequestModalProps {
    visible: boolean;
    onClose: () => void;
    bookId: string;
}

export default function RentalRequestModal({ visible, onClose, bookId }: RentalRequestModalProps) {
    return (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={() => {}}>
            <ToastProvider>
                <RentalRequestModalContent visible={visible} onClose={onClose} bookId={bookId} />
            </ToastProvider>
        </Modal>
    );
}

function RentalRequestModalContent({
    visible,
    onClose,
    bookId,
}: RentalRequestModalProps) {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuthState();
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
        area,
        setArea,
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
    const { addresses: previousAddresses, isLoading: previousAddressesLoading } = usePreviousAddresses();
    const [selectedPreviousAddress, setSelectedPreviousAddress] = useState<AddressTemplate | null>(null);
    const [verifyingAddressId, setVerifyingAddressId] = useState<string | null>(null);
    const [exitConfirmVisible, setExitConfirmVisible] = useState(false);

    const handleZoneChange = (newZone: string) => {
        setZone(newZone);
        setSelectedPreviousAddress(null);
    };
    const [mismatchModalVisible, setMismatchModalVisible] = useState(false);
    const [mismatchConfig, setMismatchConfig] = useState({
        title: "",
        message: "",
        confirmLabel: "",
        onConfirm: () => { },
    });

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

                const detectedArea = resolveDeliveryAreaFromLocation({
                    formattedAddress: fullAddress,
                    latitude: nextLatitude,
                    longitude: nextLongitude,
                })?.area;

                if (detectedArea) {
                    if (area && area !== detectedArea.name) {
                        setMismatchConfig({
                            title: "Location Mismatch",
                            message: `We detected your location as ${detectedArea.name}, but you selected ${area}.`,
                            confirmLabel: `Change to ${detectedArea.name}`,
                            onConfirm: () => {
                                setArea(detectedArea.name);
                                setMismatchModalVisible(false);
                            },
                        });
                        setMismatchModalVisible(true);
                    } else if (!area) {
                        setArea(detectedArea.name);
                    }
                } else if (area) {
                    setMismatchConfig({
                        title: "Location Mismatch",
                        message: "Your current location does not match the selected delivery area.",
                        confirmLabel: "Change Area",
                        onConfirm: () => {
                            setArea("");
                            setMismatchModalVisible(false);
                        },
                    });
                    setMismatchModalVisible(true);
                }
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
            const location = await getReliableCurrentLocation();
            console.log("[Location] Position received:", location.coords);
            await updateAddressFromCoords(
                location.coords.latitude,
                location.coords.longitude
            );
            showToast("Location updated!", "success");
        } catch (error) {
            console.error("[Location] handleGetLocation error:", error);
            showToast(
                error instanceof Error
                    ? error.message
                    : "Failed to fetch location. Please try again.",
                "error"
            );
        } finally {
            setIsLocating(false);
        }
    };

    const handleAreaChange = (nextArea: string) => {
        setArea(nextArea);

        if (!formattedAddress.trim() && (latitude === undefined || longitude === undefined)) {
            return;
        }

        const validation = validateDeliveryAreaSelection({
            selectedArea: nextArea,
            formattedAddress,
            latitude,
            longitude,
        });

        if (!validation.isValid && validation.reason !== "missing_location") {
            setMismatchConfig({
                title: "Location Mismatch",
                message:
                    validation.reason === "address_mismatch" && validation.detectedArea
                        ? `We detected your location as ${validation.detectedArea.name}, but you selected ${nextArea}.`
                        : validation.message,
                confirmLabel: "Change Area",
                onConfirm: () => {
                    setArea("");
                    setMismatchModalVisible(false);
                },
            });
            setMismatchModalVisible(true);
        }
    };

    const handleSubmitRequest = async () => {
        if (zone === "Home") {
            if (!phone && !landmark.trim() && !area.trim() && !formattedAddress.trim() && latitude === undefined) {
                showToast("Please fill in the details.", "error");
                return;
            }

            const validation = validateDeliveryAreaSelection({
                selectedArea: area,
                formattedAddress,
                latitude,
                longitude,
            });

            if (!validation.isValid) {
                if (validation.reason === "invalid_area" || validation.reason === "missing_location") {
                    showToast(validation.message, "error");
                    return;
                }

                if (validation.reason === "address_mismatch" && validation.detectedArea) {
                    setMismatchConfig({
                        title: "Location Mismatch",
                        message: `We detected your location as ${validation.detectedArea.name}, but you selected ${area}.`,
                        confirmLabel: `Change to ${validation.detectedArea.name}`,
                        onConfirm: () => {
                            setArea(validation.detectedArea!.name);
                            setMismatchModalVisible(false);
                        },
                    });
                } else {
                    setMismatchConfig({
                        title: "Location Mismatch",
                        message: validation.message,
                        confirmLabel: "Change Area",
                        onConfirm: () => {
                            setArea("");
                            setMismatchModalVisible(false);
                        },
                    });
                }
                setMismatchModalVisible(true);
                showToast(validation.message, "error");
                return;
            }
        }

        await handleRequest();
    };

    const handleSelectPreviousAddress = async (template: AddressTemplate) => {
        if (template.zone === "Home") {
            // Immediately verify GPS against the saved area
            setVerifyingAddressId(template.id);
            try {
                const location = await getReliableCurrentLocation();
                const { latitude: lat, longitude: lng } = location.coords;

                // Validate current GPS against the saved area
                const validation = validateDeliveryAreaSelection({
                    selectedArea: template.area ?? "",
                    latitude: lat,
                    longitude: lng,
                });

                if (!validation.isValid && validation.reason !== "missing_location") {
                    showToast(
                        "You're not currently in the saved delivery area. Please use a different address.",
                        "error"
                    );
                    return;
                }

                // GPS valid — fill everything including live coords
                setZone(template.zone);
                setPhone(template.phone);
                setArea(template.area ?? "");
                setLandmark(template.landmark ?? "");
                setLatitude(lat);
                setLongitude(lng);

                // Reverse geocode the current position for the formatted address
                const address = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
                if (address?.[0]) {
                    const addr = address[0];
                    setFormattedAddress(
                        [addr.name, addr.street, addr.district, addr.city, addr.region, addr.postalCode]
                            .filter(Boolean)
                            .join(", ")
                    );
                }

                setSelectedPreviousAddress(template);
                showToast("Location verified! Ready to submit.", "success");
            } catch (error) {
                showToast(
                    error instanceof Error ? error.message : "Failed to verify location.",
                    "error"
                );
            } finally {
                setVerifyingAddressId(null);
            }
        } else {
            // College: check student verification
            if (!user?.isVerifiedStudent) {
                showToast("You must verify your student status first.", "error");
                return;
            }
            setZone(template.zone);
            setPhone(template.phone);
            setRoomNo(template.roomNo ?? "");
            setYearOfStudy(template.yearOfStudy ?? "");
            setDepartment(template.department ?? "");
            setRollNo(template.rollNo ?? "");
            setSelectedPreviousAddress(template);
            showToast("Address selected! Ready to submit.", "success");
        }
    };

    const handleClearPreviousAddress = () => {
        setSelectedPreviousAddress(null);
    };

    const isBusy = loading || verifyingAddressId !== null || isLocating;

    const handleClose = () => {
        if (isBusy) {
            setExitConfirmVisible(true);
        } else {
            onClose();
        }
    };

    // Intercept Android hardware back button
    useEffect(() => {
        if (!visible) return;
        const sub = BackHandler.addEventListener("hardwareBackPress", () => {
            handleClose();
            return true; // prevent default back
        });
        return () => sub.remove();
    }, [visible, isBusy]);

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
            <RentalRequestForm
                fadeAnim={fadeAnim}
                slideAnim={slideAnim}
                zone={zone}
                setZone={handleZoneChange}
                roomNo={roomNo}
                setRoomNo={setRoomNo}
                yearOfStudy={yearOfStudy}
                setYearOfStudy={setYearOfStudy}
                department={department}
                setDepartment={setDepartment}
                rollNo={rollNo}
                setRollNo={setRollNo}
                area={area}
                setArea={handleAreaChange}
                landmark={landmark}
                setLandmark={setLandmark}
                phone={phone}
                setPhone={setPhone}
                formattedAddress={formattedAddress}
                latitude={latitude}
                longitude={longitude}
                isLocating={isLocating}
                onGetLocation={handleGetLocation}
                onSubmit={handleSubmitRequest}
                loading={loading}
                onAdjustLocation={() => setIsMapPickerVisible(true)}
                showAdjustLocation={
                    FEATURE_FLAGS.enableMapAdjustment &&
                    latitude !== undefined &&
                    longitude !== undefined
                }
                isVerifiedStudent={user?.isVerifiedStudent === true}
                onVerifyPress={() => {
                    onClose();
                    router.push("/profile/verify");
                }}
                previousAddresses={previousAddresses}
                previousAddressesLoading={previousAddressesLoading}
                onSelectPreviousAddress={handleSelectPreviousAddress}
                selectedPreviousAddress={selectedPreviousAddress}
                onClearPreviousAddress={handleClearPreviousAddress}
                verifyingAddressId={verifyingAddressId}
            />
        );
    };

    return (
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
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

                {FEATURE_FLAGS.enableMapAdjustment &&
                isMapPickerVisible &&
                latitude !== undefined &&
                longitude !== undefined ? (
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

                <ConfirmActionModal
                    visible={mismatchModalVisible}
                    title={mismatchConfig.title}
                    message={mismatchConfig.message}
                    confirmLabel={mismatchConfig.confirmLabel}
                    cancelLabel="Keep Selected Area"
                    stackActions
                    onConfirm={mismatchConfig.onConfirm}
                    onCancel={() => setMismatchModalVisible(false)}
                />

                <ConfirmActionModal
                    visible={exitConfirmVisible}
                    title="Are you sure?"
                    message="A process is still running. Are you sure you want to go back?"
                    confirmLabel="Yes, Go Back"
                    cancelLabel="Stay"
                    stackActions
                    onConfirm={() => {
                        setExitConfirmVisible(false);
                        onClose();
                    }}
                    onCancel={() => setExitConfirmVisible(false)}
                />
            </SafeAreaView>
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
        gap: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
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
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
});
