import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import InputField from "@/components/ui/core/InputField";
import DropdownField from "@/components/ui/core/DropdownField";
import { ALLOWED_AREAS } from "@/utils/location/areas";
import DeliveryZoneSelector from "@/components/rental/form/DeliveryZoneSelector";

interface ReturnAddressFormProps {
    zone: string;
    setZone: (val: string) => void;
    isVerifiedStudent: boolean;
    useSameAddress: boolean;
    setUseSameAddress: (val: boolean) => void;
    phone: string;
    setPhone: (val: string) => void;
    landmark: string;
    setLandmark: (val: string) => void;
    roomNo: string;
    setRoomNo: (val: string) => void;
    yearOfStudy: string;
    setYearOfStudy: (val: string) => void;
    department: string;
    setDepartment: (val: string) => void;
    rollNo: string;
    setRollNo: (val: string) => void;
    area: string;
    handleAreaChange: (val: string) => void;
    latitude: number | undefined;
    longitude: number | undefined;
    formattedAddress: string;
    isLocating: boolean;
    onLocatePress: () => void;
    deliveryLocation?: any;
}

export default function ReturnAddressForm({
    zone,
    setZone,
    isVerifiedStudent,
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
    area,
    handleAreaChange,
    latitude,
    longitude,
    formattedAddress,
    isLocating,
    onLocatePress,
    deliveryLocation,
}: ReturnAddressFormProps) {
    return (
        <View>
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

            {useSameAddress && deliveryLocation && (
                <View style={styles.readOnlyCard}>
                    <View style={styles.readOnlyIcon}>
                        <Ionicons
                            name={zone === "Home" ? "home" : "school"}
                            size={18}
                            color={Colors.primary}
                        />
                    </View>
                    <View style={styles.readOnlyContent}>
                        <Text style={styles.readOnlyTitle}>
                            {zone === "Home"
                                ? [deliveryLocation.area, deliveryLocation.landmark].filter(Boolean).join(" · ") || "No details"
                                : [deliveryLocation.department, `Room ${deliveryLocation.roomNo}`].filter(Boolean).join(" · ") || "No details"}
                        </Text>
                        <Text style={styles.readOnlySubtitle} numberOfLines={1}>
                            Phone: {deliveryLocation.phone}
                        </Text>
                    </View>
                </View>
            )}

            {!useSameAddress && (
                <View style={styles.customAddressSection}>
                    <DeliveryZoneSelector 
                        zone={zone} 
                        setZone={setZone} 
                        isVerifiedStudent={isVerifiedStudent} 
                    />
                    {zone === "College" ? (
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
                                onPress={onLocatePress}
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
        </View>
    );
}

const styles = StyleSheet.create({
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
        backgroundColor: Colors.surfaceCard,
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
    readOnlyCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.surfaceCard,
        borderRadius: 12,
        padding: Spacing.sm + 2,
        borderWidth: 1,
        borderColor: Colors.border,
        marginTop: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    readOnlyIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.primary + "10",
        justifyContent: "center",
        alignItems: "center",
        marginRight: Spacing.sm,
    },
    readOnlyContent: {
        flex: 1,
    },
    readOnlyTitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 2,
    },
    readOnlySubtitle: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
    },
});
