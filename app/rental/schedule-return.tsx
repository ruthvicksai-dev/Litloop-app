import BookLoader from "@/components/ui/feedback/BookLoader";
import Button from "@/components/ui/core/Button";
import ConfirmActionModal from "@/components/ui/feedback/ConfirmActionModal";
import DropdownField from "@/components/ui/core/DropdownField";
import InputField from "@/components/ui/core/InputField";
import MapLocationPicker from "@/components/ui/pickers/MapLocationPicker";
import SlotDatePicker from "@/components/ui/pickers/SlotDatePicker";
import SlotTimePicker from "@/components/ui/pickers/SlotTimePicker";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useToast } from "@/context/ToastContext";
import { useScheduleReturnScreen } from "@/hooks";
import { 
    getReliableCurrentLocation,
    ALLOWED_AREAS,
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
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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

                        <View style={styles.sectionDivider}>
                            <Text style={styles.sectionTitle}>Pickup Address</Text>
                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={() => setUseSameAddress(!useSameAddress)}
                            >
                                <View style={[styles.checkbox, useSameAddress && styles.checkboxActive]}>
                                    {useSameAddress && <Ionicons name="checkmark" size={12} color={Colors.white} />}
                                </View>
                                <Text style={styles.checkboxLabel}>Same as delivery address</Text>
                            </TouchableOpacity>
                        </View>

                        {!useSameAddress && (
                            <View style={styles.customAddressSection}>
                                {rental.zone === "College" ? (
                                    <>
                                        <InputField
                                            label="Room No"
                                            placeholder="e.g. 205"
                                            value={roomNo}
                                            onChangeText={setRoomNo}
                                        />
                                        <View style={styles.row}>
                                            <View style={styles.halfColumn}>
                                                <InputField
                                                    label="Year of Study"
                                                    placeholder="e.g. 3rd"
                                                    value={yearOfStudy}
                                                    onChangeText={setYearOfStudy}
                                                />
                                            </View>
                                            <View style={styles.halfColumn}>
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
                                ) : (
                                    <>
                                        <TouchableOpacity
                                            style={styles.locationBtn}
                                            disabled={isLocating}
                                            onPress={async () => {
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
                                        >
                                            <View style={styles.locationBtnContent}>
                                                {isLocating ? (
                                                    <ActivityIndicator size="small" color={Colors.primary} />
                                                ) : (
                                                    <Ionicons name="location" size={18} color={Colors.primary} />
                                                )}
                                                <Text style={styles.locationBtnText}>
                                                    {isLocating ? "Locating..." : "Use Current Location"}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                        {formattedAddress ? (
                                            <View style={styles.addressDisplay}>
                                                <Text style={styles.addressText}>{formattedAddress}</Text>
                                                {latitude !== undefined && longitude !== undefined ? (
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
                                        <DropdownField
                                            label="Pickup Area"
                                            value={area}
                                            options={ALLOWED_AREAS}
                                            onSelect={handleAreaChange}
                                            placeholder="Select a pickup area"
                                        />
                                        <InputField
                                            label="Landmark / Area"
                                            placeholder="e.g. Near Temple"
                                            value={landmark}
                                            onChangeText={setLandmark}
                                        />
                                    </>
                                )}
                                <InputField
                                    label="Pickup Contact"
                                    placeholder="Phone number"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        )}

                        <View style={styles.ratingCard}>
                            <Text style={styles.ratingTitle}>Rate this book</Text>
                            <Text style={styles.ratingSubtitle}>
                                Your rating will be shown to other readers in book cards.
                            </Text>
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity
                                        key={star}
                                        onPress={() => setUserRating(star)}
                                        activeOpacity={0.8}
                                        style={styles.starButton}
                                    >
                                        <Ionicons
                                            name={userRating >= star ? "star" : "star-outline"}
                                            size={30}
                                            color={userRating >= star ? Colors.warning : Colors.textLight}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TextInput
                                style={styles.reviewInput}
                                placeholder="Share your experience with this book (optional)"
                                placeholderTextColor={Colors.textLight}
                                value={reviewText}
                                onChangeText={setReviewText}
                                multiline
                                numberOfLines={3}
                                maxLength={500}
                                textAlignVertical="top"
                            />
                            {reviewText.length > 0 && (
                                <Text style={styles.charCount}>{reviewText.length}/500</Text>
                            )}
                        </View>

                        {estimatedDays > 0 ? (
                            <View style={styles.estimateCard}>
                                <Text style={styles.estimateTitle}>Rent Estimate</Text>
                                <View style={styles.estimateRow}>
                                    <Text style={styles.estimateLabel}>Days</Text>
                                    <Text style={styles.estimateValue}>{estimatedDays}</Text>
                                </View>
                                <View style={styles.estimateRow}>
                                    <Text style={styles.estimateLabel}>Rate</Text>
                                    <Text style={styles.estimateValue}>₹{rental?.rentPerDay}/day</Text>
                                </View>
                                <View style={[styles.estimateRow, styles.totalRow]}>
                                    <Text style={[styles.estimateLabel, styles.totalLabel]}>Total</Text>
                                    <Text style={styles.totalValue}>₹{estimatedRent}</Text>
                                </View>
                            </View>
                        ) : null}

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
        backgroundColor: Colors.white,
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
    estimateCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        marginTop: Spacing.md,
    },
    ratingCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        marginTop: Spacing.md,
    },
    ratingTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    ratingSubtitle: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        marginTop: 4,
    },
    starsRow: {
        flexDirection: "row",
        marginTop: Spacing.sm,
        gap: 8,
    },
    starButton: {
        paddingVertical: 4,
    },
    estimateTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    estimateRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    estimateLabel: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
    estimateValue: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: 8,
        marginTop: 4,
    },
    totalLabel: {
        fontFamily: Fonts.bold,
    },
    totalValue: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
    sectionDivider: {
        marginTop: Spacing.lg,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    sectionTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    checkboxRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: Spacing.sm,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: Colors.primary,
        marginRight: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxActive: {
        backgroundColor: Colors.primary,
    },
    checkboxLabel: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    customAddressSection: {
        marginTop: Spacing.sm,
        backgroundColor: Colors.white,
        padding: Spacing.md,
        borderRadius: 12,
        gap: 2,
    },
    row: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
    halfColumn: {
        flex: 1,
        minWidth: 0,
    },
    locationBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 8,
        marginBottom: Spacing.md,
    },
    locationBtnContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    locationBtnText: {
        color: Colors.primary,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.body,
    },
    addressDisplay: {
        backgroundColor: Colors.background,
        padding: Spacing.sm,
        borderRadius: 8,
        marginBottom: Spacing.md,
    },
    addressText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.regular,
        color: Colors.text,
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
    reviewInput: {
        marginTop: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: Spacing.sm,
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        minHeight: 80,
        backgroundColor: Colors.background,
    },
    charCount: {
        fontSize: FontSizes.caption,
        color: Colors.textLight,
        textAlign: "right",
        marginTop: 2,
        fontFamily: Fonts.regular,
    },
});
