import RentalRequestForm from "@/components/rental/RentalRequestForm";
import { GuestView } from "@/components/profile/GuestProfileView";
import BookLoader from "@/components/ui/feedback/BookLoader";
import ConfirmActionModal from "@/components/ui/feedback/ConfirmActionModal";
import MapLocationPicker from "@/components/ui/pickers/MapLocationPicker";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useFadeSlideIn, useRequestRentalScreen } from "@/hooks";
import { 
    getReliableCurrentLocation,
    resolveDeliveryAreaFromLocation,
    validateDeliveryAreaSelection,
} from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RequestRentalScreen() {
    const { bookId } = useLocalSearchParams<{ bookId: string }>();
    const router = useRouter();
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
    const [isLocating, setIsLocating] = React.useState(false);
    const [isMapPickerVisible, setIsMapPickerVisible] = React.useState(false);
    const [mismatchModalVisible, setMismatchModalVisible] = React.useState(false);
    const [mismatchConfig, setMismatchConfig] = React.useState({
        title: "",
        message: "",
        confirmLabel: "",
        onConfirm: () => { },
    });

    const updateAddressFromCoords = async (nextLatitude: number, nextLongitude: number) => {
        setLatitude(nextLatitude);
        setLongitude(nextLongitude);

        const address = await Location.reverseGeocodeAsync({
            latitude: nextLatitude,
            longitude: nextLongitude,
        });

        if (address && address.length > 0) {
            const addr = address[0];
            const fullAddress = [
                addr.name,
                addr.street,
                addr.district,
                addr.city,
                addr.region,
                addr.postalCode,
            ].filter(Boolean).join(", ");
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
        }
    };

    const handleGetLocation = async () => {
        setIsLocating(true);
        try {
            const location = await getReliableCurrentLocation();

            await updateAddressFromCoords(
                location.coords.latitude,
                location.coords.longitude
            );
            showToast("Location updated!", "success");
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to fetch location. Please try again.";
            showToast(message, "error");
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
            const validation = validateDeliveryAreaSelection({
                selectedArea: area,
                formattedAddress,
                latitude,
                longitude,
            });

            if (!validation.isValid) {
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
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Request Rental</Text>
                    <Text style={styles.bookInfo}>
                        {book.title} {"\u20B9"}{book.rentPerDay}/day
                    </Text>
                </View>
            </View>

            <RentalRequestForm
                fadeAnim={fadeAnim}
                slideAnim={slideAnim}
                zone={zone}
                setZone={setZone}
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
                showAdjustLocation={latitude !== undefined && longitude !== undefined}
                isVerifiedStudent={user.isVerifiedStudent === true}
                onVerifyPress={() => router.push("/profile/verify")}
            />

            {latitude !== undefined && longitude !== undefined ? (
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
        paddingTop: 8,
    },
    backBtn: {
        alignSelf: "flex-start",
        padding: 4,
        marginLeft: -4,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: FontSizes.heading,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    bookInfo: {
        fontSize: FontSizes.body,
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
