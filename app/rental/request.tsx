import BookLoader from "@/components/ui/BookLoader";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing, ZONES } from "@/constants/theme";
import { useToast } from "@/context/ToastContext";
import { useFadeSlideIn, useRequestRentalScreen } from "@/hooks";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RequestRentalScreen() {
    const { bookId } = useLocalSearchParams<{ bookId: string }>();
    const router = useRouter();
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
    const [isLocating, setIsLocating] = React.useState(false);

    const handleGetLocation = async () => {
        setIsLocating(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                showToast("Permission to access location was denied", "error");
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLatitude(location.coords.latitude);
            setLongitude(location.coords.longitude);

            let address = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
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
            }
            showToast("Location updated!", "success");
        } catch {
            showToast("Failed to fetch location. Please try manually.", "error");
        } finally {
            setIsLocating(false);
        }
    };
    if (book === undefined) {
        return (
            <View style={styles.center}>
                <BookLoader label="Loading details..." />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
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
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>

                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }}
                    >
                        <Text style={styles.title}>Request Rental</Text>
                        {book ? (
                            <Text style={styles.bookInfo}>
                                {book.title}  {"\u20B9"}{book.rentPerDay}/day
                            </Text>
                        ) : null}

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
                            onPress={handleRequest}
                            loading={loading}
                            style={{ marginTop: Spacing.md }}
                        />
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingHorizontal: 20,
        paddingTop: Spacing.sm,
        paddingBottom: 28,
    },
    backBtn: {
        marginBottom: Spacing.md,
        alignSelf: "flex-start",
        padding: 4,
        marginLeft: -4,
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
    placeholderText: {
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        textAlign: "center",
        marginVertical: Spacing.xl,
    },
    backText: {
        fontSize: FontSizes.subtitle,
        color: Colors.primary,
        fontFamily: Fonts.medium,
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: FontSizes.heading,
        color: Colors.text,
        marginBottom: 4,
        fontFamily: Fonts.bold,
    },
    bookInfo: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
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
