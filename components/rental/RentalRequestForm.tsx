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
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DeliveryZoneSelector from "@/components/rental/form/DeliveryZoneSelector";
import CollegeZoneFields from "@/components/rental/form/CollegeZoneFields";
import HomeZoneFields from "@/components/rental/form/HomeZoneFields";
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
}: RentalRequestFormProps) {
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);

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
                    <DeliveryZoneSelector zone={zone} setZone={setZone} />

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
                    ) : zone === "Home" ? (
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
                    ) : (
                        <Text style={styles.placeholderText}>
                            Please select a zone to enter address details.
                        </Text>
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
                        onPress={onSubmit}
                        loading={loading}
                        disabled={loading || (zone === "College" && !isVerifiedStudent)}
                        style={[
                            styles.submitButton,
                            (zone === "College" && !isVerifiedStudent) && styles.submitButtonDisabled
                        ]}
                    />
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
});
