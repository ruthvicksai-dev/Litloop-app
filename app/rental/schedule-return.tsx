import BookLoader from "@/components/ui/feedback/BookLoader";
import Button from "@/components/ui/core/Button";
import ConfirmActionModal from "@/components/ui/feedback/ConfirmActionModal";
import MapLocationPicker from "@/components/ui/pickers/MapLocationPicker";
import SlotDatePicker from "@/components/ui/pickers/SlotDatePicker";
import SlotTimePicker from "@/components/ui/pickers/SlotTimePicker";
import ReturnAddressForm from "@/components/rental/return/ReturnAddressForm";
import ReturnRatingForm from "@/components/rental/return/ReturnRatingForm";
import ReturnEstimateCard from "@/components/rental/return/ReturnEstimateCard";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useToast } from "@/context/ToastContext";
import { useScheduleReturnScreen } from "@/hooks";
import { 
    getReliableCurrentLocation,
    resolveDeliveryAreaFromLocation,
    validateDeliveryAreaSelection,
    formatDateString,
    getValidDates,
    getValidTimeSlots 
} from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScheduleReturnScreen() {
    const { rentalId } = useLocalSearchParams<{ rentalId: string }>();
    const router = useRouter();
    const { showToast } = useToast();
    const {
        rental,
        pickupDate,
        setPickupDate,
        pickupTime,
        setPickupTime,
        userRating,
        setUserRating,
        reviewText,
        setReviewText,
        loading,
        estimatedDays,
        estimatedRent,
        handleSchedule,
        useSameAddress,
        setUseSameAddress,
        phone,
        setPhone,
        landmark,
        setLandmark,
        roomNo,
        setRoomNo,
        yearOfStudy,
        setYearOfStudy,
        department,
        setDepartment,
        rollNo,
        setRollNo,
        setLatitude,
        setLongitude,
        area,
        setArea,
        latitude,
        longitude,
        formattedAddress,
        setFormattedAddress,
    } = useScheduleReturnScreen(rentalId);
    const [isMapPickerVisible, setIsMapPickerVisible] = React.useState(false);
    const [isLocating, setIsLocating] = React.useState(false);
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
            const fullAddress = [addr.name, addr.street, addr.district, addr.city, addr.region, addr.postalCode]
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
                        }
                    });
                    setMismatchModalVisible(true);
                } else if (!area) {
                    setArea(detectedArea.name);
                }
            } else if (area) {
                setMismatchConfig({
                    title: "Location Mismatch",
                    message: "Your current location does not match the selected pickup area.",
                    confirmLabel: "Change Area",
                    onConfirm: () => {
                        setArea("");
                        setMismatchModalVisible(false);
                    }
                });
                setMismatchModalVisible(true);
            }
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
                        : "Your current location does not match the selected pickup area.",
                confirmLabel: "Change Area",
                onConfirm: () => {
                    setArea("");
                    setMismatchModalVisible(false);
                }
            });
            setMismatchModalVisible(true);
        }
    };

    const handleSubmitPickup = async () => {
        if (!useSameAddress && rental?.zone === "Home") {
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
                        message: "Your current location does not match the selected pickup area.",
                        confirmLabel: "Change Area",
                        onConfirm: () => {
                            setArea("");
                            setMismatchModalVisible(false);
                        },
                    });
                }

                setMismatchModalVisible(true);
                showToast(
                    "Your current location does not match the selected pickup area.",
                    "error"
                );
                return;
            }
        }

        await handleSchedule();
    };

    const availableDates = React.useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nextDayAfterDelivery = rental?.deliveryDate
            ? new Date(new Date(rental.deliveryDate).getTime() + 24 * 60 * 60 * 1000)
            : today;

        const start = new Date(Math.max(today.getTime(), nextDayAfterDelivery.getTime()));
        return getValidDates(start, 5);
    }, [rental?.deliveryDate]);

    const availableTimeSlots = React.useMemo(() => {
        if (!pickupDate) return [];
        const isToday = pickupDate === formatDateString(new Date());
        let minTime: string | undefined = undefined;
        if (pickupDate === rental?.deliveryDate && rental?.deliveryTime) {
            minTime = rental.deliveryTime;
        }
        return getValidTimeSlots(isToday, minTime);
    }, [pickupDate, rental?.deliveryDate, rental?.deliveryTime]);

    // Auto-select first date and time slot
    React.useEffect(() => {
        if (availableDates.length > 0) {
            const isValidSetDate = availableDates.some(d => formatDateString(d) === pickupDate);
            if (!pickupDate || !isValidSetDate) {
                setPickupDate(formatDateString(availableDates[0]));
            }
        }
    }, [availableDates, pickupDate, setPickupDate]);

    React.useEffect(() => {
        if (availableTimeSlots.length > 0 && !pickupTime) {
            setPickupTime(availableTimeSlots[0]);
        } else if (availableTimeSlots.length > 0 && pickupTime && !availableTimeSlots.includes(pickupTime)) {
            setPickupTime(availableTimeSlots[0]);
        }
    }, [availableTimeSlots, pickupTime, setPickupTime]);

    if (rental === undefined) {
        return (
            <View style={styles.center}>
                <BookLoader label="Loading rental..." />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>
                    Schedule Return
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                >
                    <View>
                        <View style={styles.infoCard}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>Book</Text>
                                <Text style={styles.infoValue}>{rental?.book?.title || "Loading..."}</Text>
                            </View>
                            {rental?.deliveryDate ? (
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={styles.infoLabel}>Delivered on</Text>
                                    <Text style={styles.infoValue}>{rental.deliveryDate}</Text>
                                </View>
                            ) : null}
                        </View>

                        <SlotDatePicker
                            label="Pickup Date"
                            dates={availableDates}
                            selectedDate={pickupDate}
                            onSelect={setPickupDate}
                        />

                        <SlotTimePicker
                            label="Pickup Time"
                            slots={availableTimeSlots}
                            selectedTime={pickupTime}
                            onSelect={setPickupTime}
                            emptyMessage="No slots available for this date. Please select another date."
                        />

                        <ReturnAddressForm
                            zone={rental.zone}
                            useSameAddress={useSameAddress}
                            setUseSameAddress={setUseSameAddress}
                            phone={phone}
                            setPhone={setPhone}
                            landmark={landmark}
                            setLandmark={setLandmark}
                            roomNo={roomNo}
                            setRoomNo={setRoomNo}
                            yearOfStudy={yearOfStudy}
                            setYearOfStudy={setYearOfStudy}
                            department={department}
                            setDepartment={setDepartment}
                            rollNo={rollNo}
                            setRollNo={setRollNo}
                            area={area}
                            handleAreaChange={handleAreaChange}
                            latitude={latitude}
                            longitude={longitude}
                            formattedAddress={formattedAddress}
                            isLocating={isLocating}
                            onLocatePress={async () => {
                                try {
                                    setIsLocating(true);
                                    const location = await getReliableCurrentLocation();

                                    await updateAddressFromCoords(
                                        location.coords.latitude,
                                        location.coords.longitude
                                    );
                                    showToast("Location updated!", "success");
                                } catch (error) {
                                    showToast(
                                        error instanceof Error
                                            ? error.message
                                            : "Failed to fetch location. Please try again.",
                                        "error"
                                    );
                                } finally {
                                    setIsLocating(false);
                                }
                            }}
                            onAdjustMapPress={() => setIsMapPickerVisible(true)}
                        />

                        <ReturnRatingForm
                            userRating={userRating}
                            setUserRating={setUserRating}
                            reviewText={reviewText}
                            setReviewText={setReviewText}
                        />

                        <ReturnEstimateCard
                            estimatedDays={estimatedDays}
                            rentPerDay={rental?.rentPerDay}
                            estimatedRent={estimatedRent}
                        />

                        <Button
                            title="Schedule Pickup"
                            onPress={handleSubmitPickup}
                            loading={loading}
                            style={{ marginTop: Spacing.md }}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            {latitude !== undefined && longitude !== undefined ? (
                <MapLocationPicker
                    visible={isMapPickerVisible}
                    latitude={latitude}
                    longitude={longitude}
                    title="Adjust Pickup Location"
                    subtitle="Drag the pin or tap the map, then confirm the exact pickup point."
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
    flex: {
        flex: 1,
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xl * 1.5,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: Spacing.sm,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: FontSizes.title,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    headerSpacer: {
        width: 40,
    },
    infoCard: {
        backgroundColor: Colors.surfaceCard,
        borderRadius: 12,
        padding: Spacing.md,
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: Spacing.lg,
    },
    infoLabel: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
    infoValue: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
});
