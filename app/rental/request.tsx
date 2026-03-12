import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Colors, Spacing, ZONES } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function RequestRentalScreen() {
    const { bookId } = useLocalSearchParams<{ bookId: string }>();
    const book = useQuery(api.books.get, {
        bookId: bookId as Id<"books">,
    });
    const { userId } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const requestRental = useMutation(api.rentals.requestRental);

    const [zone, setZone] = useState("");
    const [area, setArea] = useState("");
    const [city, setCity] = useState("");
    const [landmark, setLandmark] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    // Entrance animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleRequest = async () => {
        if (!zone) {
            showToast("Please select a zone.", "error");
            return;
        }
        if (!area.trim()) {
            showToast("Area/Hostel/Apartment is required.", "error");
            return;
        }
        if (!city.trim()) {
            showToast("City is required.", "error");
            return;
        }
        if (!phone.trim()) {
            showToast("Phone number is required.", "error");
            return;
        }

        setLoading(true);
        try {
            await requestRental({
                userId: userId! as Id<"users">,
                bookId: bookId as Id<"books">,
                zone,
                deliveryLocation: { area, city, landmark, phone },
            });
            showToast("Book requested successfully!", "success");
            router.replace("/(tabs)/my-rentals");
        } catch (error: any) {
            showToast(error.message || "Failed to request book.", "error");
        } finally {
            setLoading(false);
        }
    };

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
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>

                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }}
                    >
                        <Text style={styles.title}>Request Rental</Text>
                        {book && (
                            <Text style={styles.bookInfo}>
                                {book.title} • ₹{book.rentPerDay}/day
                            </Text>
                        )}

                        <Text style={styles.sectionTitle}>Delivery Zone</Text>
                        <View style={styles.zoneGrid}>
                            {ZONES.map((z) => (
                                <TouchableOpacity
                                    key={z}
                                    style={[
                                        styles.zoneChip,
                                        zone === z && styles.zoneChipActive,
                                    ]}
                                    onPress={() => setZone(z)}
                                >
                                    <Text
                                        style={[
                                            styles.zoneChipText,
                                            zone === z &&
                                            styles.zoneChipTextActive,
                                        ]}
                                    >
                                        {z}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.sectionTitle}>
                            Delivery Address
                        </Text>
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
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingTop: SCREEN_HEIGHT * 0.02,
        paddingBottom: SCREEN_HEIGHT * 0.04,
    },
    backText: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: "600",
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: SCREEN_WIDTH * 0.06,
        fontWeight: "800",
        color: Colors.text,
        marginBottom: 4,
    },
    bookInfo: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
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
        paddingHorizontal: SCREEN_WIDTH * 0.04,
        paddingVertical: SCREEN_HEIGHT * 0.012,
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
        fontSize: 13,
        fontWeight: "600",
        color: Colors.text,
    },
    zoneChipTextActive: {
        color: Colors.white,
    },
});
