import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Colors, Spacing, ZONES } from "@/constants/theme";
import { useFadeSlideIn } from "@/hooks/useFadeSlideIn";
import { useRequestRentalScreen } from "@/hooks/useRequestRentalScreen";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
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
import { Fonts, FontSizes } from "@/constants/fonts";

export default function RequestRentalScreen() {
    const { bookId } = useLocalSearchParams<{ bookId: string }>();
    const router = useRouter();
    const { fadeAnim, slideAnim } = useFadeSlideIn();
    const {
        book,
        zone,
        setZone,
        area,
        setArea,
        city,
        setCity,
        landmark,
        setLandmark,
        phone,
        setPhone,
        loading,
        handleRequest,
    } = useRequestRentalScreen(bookId);

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

                        <Text style={styles.sectionTitle}>Delivery Address</Text>
                        <InputField
                            label="Area / Hostel / Apartment"
                            placeholder="e.g. Room 205, Hostel A"
                            value={area}
                            onChangeText={setArea}
                        />
                        <InputField
                            label="City"
                            placeholder="e.g. Hyderabad"
                            value={city}
                            onChangeText={setCity}
                        />
                        <InputField
                            label="Landmark (optional)"
                            placeholder="e.g. Near main gate"
                            value={landmark}
                            onChangeText={setLandmark}
                        />
                        <InputField
                            label="Phone"
                            placeholder="Contact number"
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
});
