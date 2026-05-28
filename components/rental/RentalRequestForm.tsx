import Button from "@/components/ui/core/Button";
import InputField from "@/components/ui/core/InputField";
import { Spacing, Colors } from "@/constants/theme";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DeliveryZoneSelector from "@/components/rental/form/DeliveryZoneSelector";
import CollegeZoneFields from "@/components/rental/form/CollegeZoneFields";
import HomeZoneFields from "@/components/rental/form/HomeZoneFields";
import PreviousAddressesSection from "@/components/rental/form/PreviousAddressesSection";
import { AddressTemplate } from "@/components/rental/form/PreviousAddressCard";
import { FontSizes, Fonts } from "@/constants/fonts";

interface RentalRequestFormProps {
    fadeAnim: Animated.Value;
    slideAnim: Animated.Value;
    zone: string;
    setZone: (value: string) => void;
    roomNo: string;
    setRoomNo: (value: string) => void;
    yearOfStudy: string;
    setYearOfStudy: (value: string) => void;
    department: string;
    setDepartment: (value: string) => void;
    rollNo: string;
    setRollNo: (value: string) => void;
    area: string;
    setArea: (value: string) => void;
    landmark: string;
    setLandmark: (value: string) => void;
    phone: string;
    setPhone: (value: string) => void;
    formattedAddress: string;
    latitude?: number;
    longitude?: number;
    isLocating: boolean;
    onGetLocation: () => void;
    onSubmit: () => void;
    loading: boolean;
    onAdjustLocation?: () => void;
    showAdjustLocation?: boolean;
    isVerifiedStudent?: boolean;
    onVerifyPress?: () => void;
    previousAddresses?: AddressTemplate[];
    previousAddressesLoading?: boolean;
    onSelectPreviousAddress?: (address: AddressTemplate) => Promise<void> | void;
    selectedPreviousAddress?: AddressTemplate | null;
    onClearPreviousAddress?: () => void;
    verifyingAddressId?: string | null;
}

export default function RentalRequestForm({
    fadeAnim,
    slideAnim,
    zone,
    setZone,
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
    landmark,
    setLandmark,
    phone,
    setPhone,
    formattedAddress,
    latitude,
    longitude,
    isLocating,
    onGetLocation,
    onSubmit,
    loading,
    onAdjustLocation,
    showAdjustLocation = false,
    isVerifiedStudent,
    onVerifyPress,
    previousAddresses = [],
    previousAddressesLoading = false,
    onSelectPreviousAddress,
    selectedPreviousAddress = null,
    onClearPreviousAddress,
    verifyingAddressId = null,
}: RentalRequestFormProps) {
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);
    const [showManualEntry, setShowManualEntry] = React.useState(false);

    // Reset manual entry state when zone changes
    useEffect(() => {
        setShowManualEntry(false);
    }, [zone]);

    // Android Modal + adjustResize bug: view stays shrunken after keyboard dismisses.
    // Force a re-layout by nudging the ScrollView on keyboardDidHide.
    useEffect(() => {
        if (Platform.OS !== "android") return;
        const sub = Keyboard.addListener("keyboardDidHide", () => {
            // Tiny timeout lets the native resize settle before we re-measure
            setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), 100);
        });
        return () => sub.remove();
    }, []);

    const Wrapper = Platform.OS === "ios" ? KeyboardAvoidingView : View;
    const wrapperProps = Platform.OS === "ios"
        ? { behavior: "padding" as const, keyboardVerticalOffset: 0 }
        : {};

    return (
        <Wrapper style={styles.flex} {...wrapperProps}>
            <ScrollView
                ref={scrollRef}
                contentContainerStyle={[
                    styles.scroll,
                    { paddingBottom: Math.max(120, 80 + insets.bottom) },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }}
                >
                    <DeliveryZoneSelector zone={zone} setZone={setZone} isVerifiedStudent={isVerifiedStudent} />

                    {!zone ? (
                        <Text style={styles.placeholderText}>
                            Please select a zone to enter address details.
                        </Text>
                    ) : (
                        <>
                            {onSelectPreviousAddress && (
                                <PreviousAddressesSection
                                    addresses={previousAddresses}
                                    isLoading={previousAddressesLoading}
                                    onSelect={onSelectPreviousAddress}
                                    currentZone={zone}
                                    verifyingAddressId={verifyingAddressId}
                                />
                            )}

                            {/* Hide everything below until previous addresses finish loading */}
                            {!previousAddressesLoading && (
                                <>
                                    {/* Show selected address summary if a previous address was picked */}
                                    {selectedPreviousAddress && !showManualEntry ? (
                                        <View>
                                            <View style={styles.selectedCard}>
                                                <View style={styles.selectedCardIcon}>
                                                    <Ionicons
                                                        name={selectedPreviousAddress.zone === "Home" ? "home" : "school"}
                                                        size={18}
                                                        color={Colors.primary}
                                                    />
                                                </View>
                                                <View style={styles.selectedCardContent}>
                                                    <Text style={styles.selectedCardTitle}>
                                                        {selectedPreviousAddress.zone === "Home"
                                                            ? [selectedPreviousAddress.area, selectedPreviousAddress.landmark].filter(Boolean).join(" · ")
                                                            : [selectedPreviousAddress.department, `Room ${selectedPreviousAddress.roomNo}`].filter(Boolean).join(" · ")}
                                                    </Text>
                                                    <View style={styles.verifiedBadge}>
                                                        <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                                                        <Text style={styles.verifiedBadgeText}>Verified</Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        onClearPreviousAddress?.();
                                                        setShowManualEntry(false);
                                                    }}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                >
                                                    <Ionicons name="close-circle" size={22} color={Colors.textLight} />
                                                </TouchableOpacity>
                                            </View>

                                            <TouchableOpacity
                                                style={styles.addAnotherBtn}
                                                onPress={() => {
                                                    onClearPreviousAddress?.();
                                                    setShowManualEntry(true);
                                                }}
                                            >
                                                <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                                                <Text style={styles.addAnotherText}>Add another location</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : !selectedPreviousAddress && !showManualEntry && previousAddresses.filter(a => a.zone === zone).length > 0 ? (
                                        /* Previous addresses exist but none selected yet — hide form, show "Add another" */
                                        <TouchableOpacity
                                            style={styles.addAnotherBtn}
                                            onPress={() => setShowManualEntry(true)}
                                        >
                                            <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                                            <Text style={styles.addAnotherText}>Add another location</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        /* No previous addresses OR manual entry active — show normal form */
                                        <>
                                            <Text style={styles.sectionTitle}>Delivery Details</Text>

                                            {zone === "College" ? (
                                                <CollegeZoneFields
                                                    roomNo={roomNo}
                                                    setRoomNo={setRoomNo}
                                                    yearOfStudy={yearOfStudy}
                                                    setYearOfStudy={setYearOfStudy}
                                                    department={department}
                                                    setDepartment={setDepartment}
                                                    rollNo={rollNo}
                                                    setRollNo={setRollNo}
                                                    isVerifiedStudent={isVerifiedStudent}
                                                    onVerifyPress={onVerifyPress}
                                                />
                                            ) : (
                                                <HomeZoneFields
                                                    area={area}
                                                    setArea={setArea}
                                                    landmark={landmark}
                                                    setLandmark={setLandmark}
                                                    formattedAddress={formattedAddress}
                                                    latitude={latitude}
                                                    longitude={longitude}
                                                    isLocating={isLocating}
                                                    onGetLocation={onGetLocation}
                                                    onAdjustLocation={onAdjustLocation}
                                                    showAdjustLocation={showAdjustLocation}
                                                />
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {zone && !previousAddressesLoading ? (
                        <>
                            <InputField
                                label="Phone Number"
                                placeholder="Your contact number"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />

                            <Button
                                title="Submit Request"
                                onPress={onSubmit}
                                loading={loading}
                                disabled={loading || (zone === "College" && !isVerifiedStudent)}
                                style={[
                                    styles.submitButton,
                                    (zone === "College" && !isVerifiedStudent) && styles.submitButtonDisabled
                                ]}
                            />
                        </>
                    ) : null}
                </Animated.View>
            </ScrollView>
        </Wrapper>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    scroll: {
        paddingHorizontal: 20,
        paddingTop: Spacing.sm,
    },
    sectionTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
        marginTop: Spacing.sm,
    },
    placeholderText: {
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        textAlign: "center",
        marginVertical: Spacing.xl,
    },
    submitButton: {
        marginTop: Spacing.md,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    selectedCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.surfaceCard,
        borderRadius: 14,
        padding: Spacing.sm + 2,
        borderWidth: 1.5,
        borderColor: Colors.success + "40",
        marginBottom: Spacing.sm,
    },
    selectedCardIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.primary + "10",
        justifyContent: "center",
        alignItems: "center",
        marginRight: Spacing.sm,
    },
    selectedCardContent: {
        flex: 1,
    },
    selectedCardTitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 2,
    },
    verifiedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },
    verifiedBadgeText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.success,
    },
    addAnotherBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: Spacing.sm + 2,
        marginBottom: Spacing.sm,
    },
    addAnotherText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.primary,
    },
});
