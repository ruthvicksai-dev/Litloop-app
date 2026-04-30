import Button from "@/components/ui/core/Button";
import InputField from "@/components/ui/core/InputField";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing, ZONES } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { DELIVERY_AREA_GROUPS } from "@/utils/areaUtils";

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
}: RentalRequestFormProps) {
    const [areaPickerVisible, setAreaPickerVisible] = React.useState(false);

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
                                <View style={[styles.halfField, styles.halfFieldSpacing]}>
                                    <InputField
                                        label="Year of Study"
                                        placeholder="e.g. 3rd"
                                        value={yearOfStudy}
                                        onChangeText={setYearOfStudy}
                                    />
                                </View>
                                <View style={styles.halfField}>
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
                            <View style={styles.deliveryAreaNote}>
                                <Ionicons name="information-circle" size={16} color={Colors.primary} />
                                <Text style={styles.deliveryAreaNoteText}>
                                    Note: Deliveries are strictly restricted to the listed delivery areas below.
                                </Text>
                            </View>
                            <View style={styles.areaField}>
                                <Text style={styles.areaLabel}>Delivery Area</Text>
                                <TouchableOpacity
                                    style={styles.areaSelector}
                                    onPress={() => setAreaPickerVisible(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.areaValue,
                                            !area && styles.areaPlaceholder,
                                        ]}
                                    >
                                        {area || "Select a delivery area"}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color={Colors.textLight} />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={styles.locationBtn}
                                onPress={onGetLocation}
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
                                    {showAdjustLocation && onAdjustLocation ? (
                                        <TouchableOpacity
                                            style={styles.adjustLocationButton}
                                            onPress={onAdjustLocation}
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

                            <Modal
                                visible={areaPickerVisible}
                                transparent
                                animationType="slide"
                                onRequestClose={() => setAreaPickerVisible(false)}
                            >
                                <Pressable
                                    style={styles.areaModalBackdrop}
                                    onPress={() => setAreaPickerVisible(false)}
                                >
                                    <Pressable style={styles.areaModalSheet}>
                                        <View style={styles.areaModalHeader}>
                                            <Text style={styles.areaModalTitle}>Select Area</Text>
                                            <TouchableOpacity onPress={() => setAreaPickerVisible(false)}>
                                                <Ionicons name="close" size={24} color={Colors.text} />
                                            </TouchableOpacity>
                                        </View>
                                        <ScrollView contentContainerStyle={styles.areaModalList}>
                                            {DELIVERY_AREA_GROUPS.map((group) => (
                                                <View key={group.zone} style={styles.areaGroup}>
                                                    <Text style={styles.areaGroupTitle}>{group.title}</Text>
                                                    {group.areas.map((opt) => (
                                                        <TouchableOpacity
                                                            key={opt}
                                                            style={[
                                                                styles.areaOption,
                                                                area === opt && styles.areaOptionActive,
                                                            ]}
                                                            onPress={() => {
                                                                setArea(opt);
                                                                setAreaPickerVisible(false);
                                                            }}
                                                        >
                                                            <View style={styles.areaOptionRow}>
                                                                <Text
                                                                    style={[
                                                                        styles.areaOptionText,
                                                                        area === opt && styles.areaOptionTextActive,
                                                                    ]}
                                                                >
                                                                    {opt}
                                                                </Text>
                                                                {area === opt ? (
                                                                    <Ionicons
                                                                        name="checkmark-circle"
                                                                        size={20}
                                                                        color={Colors.primary}
                                                                    />
                                                                ) : null}
                                                            </View>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            ))}
                                        </ScrollView>
                                    </Pressable>
                                </Pressable>
                            </Modal>

                            <InputField
                                label="Street Address / Landmark"
                                placeholder="e.g. Near Ramalayam Temple"
                                value={landmark}
                                onChangeText={setLandmark}
                            />
                        </>
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
                        style={styles.submitButton}
                    />
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: Spacing.sm,
        paddingBottom: 28,
    },
    row: {
        flexDirection: "row",
    },
    halfField: {
        flex: 1,
    },
    halfFieldSpacing: {
        marginRight: Spacing.sm,
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
    deliveryAreaNote: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: Colors.primary + "10",
        borderRadius: 12,
        padding: Spacing.sm,
        marginTop: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    deliveryAreaNoteText: {
        flex: 1,
        marginLeft: 8,
        fontSize: FontSizes.small,
        color: Colors.primary,
        fontFamily: Fonts.medium,
    },
    areaField: {
        marginBottom: Spacing.md,
    },
    areaLabel: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.xs,
    },
    areaSelector: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
        minHeight: 48,
    },
    areaValue: {
        flex: 1,
        fontSize: FontSizes.subtitle,
        color: Colors.text,
        fontFamily: Fonts.regular,
    },
    areaPlaceholder: {
        color: Colors.textLight,
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
    areaModalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    areaModalSheet: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "70%",
        paddingBottom: 30,
    },
    areaModalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    areaModalTitle: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    areaModalList: {
        padding: Spacing.md,
    },
    areaGroup: {
        marginBottom: Spacing.md,
    },
    areaGroupTitle: {
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        fontFamily: Fonts.bold,
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    areaOption: {
        paddingVertical: 14,
        paddingHorizontal: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border + "50",
    },
    areaOptionActive: {
        backgroundColor: Colors.primary + "10",
        borderRadius: 8,
    },
    areaOptionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    areaOptionText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
    },
    areaOptionTextActive: {
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    placeholderText: {
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        textAlign: "center",
        marginVertical: Spacing.xl,
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
    submitButton: {
        marginTop: Spacing.md,
    },
});
