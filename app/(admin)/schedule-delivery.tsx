import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Colors, Spacing } from "@/constants/theme";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScheduleDeliveryScreen() {
    const { rentalId } = useLocalSearchParams<{ rentalId: string }>();
    const rental = useQuery(api.rentals.getRental, {
        rentalId: rentalId as Id<"rentals">,
    });
    const { showToast } = useToast();
    const router = useRouter();
    const scheduleDelivery = useMutation(api.rentals.scheduleDelivery);

    const [deliveryDate, setDeliveryDate] = useState("");
    const [deliveryTime, setDeliveryTime] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSchedule = async () => {
        if (!deliveryDate) {
            showToast("Delivery date is required.", "error");
            return;
        }
        if (!deliveryTime) {
            showToast("Delivery time is required.", "error");
            return;
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(deliveryDate)) {
            showToast("Date should be in YYYY-MM-DD format.", "error");
            return;
        }

        setLoading(true);
        try {
            await scheduleDelivery({
                rentalId: rentalId as Id<"rentals">,
                deliveryDate,
                deliveryTime,
            });
            showToast("Delivery scheduled!", "success");
            router.back();
        } catch (error: any) {
            showToast(error.message || "Failed to schedule delivery.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!rental) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Schedule Delivery</Text>

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>{rental.book?.title}</Text>
                    <Text style={styles.infoSub}>
                        For: {rental.user?.name} • {rental.user?.phone}
                    </Text>
                    <Text style={styles.infoSub}>
                        📍 {rental.zone} — {rental.deliveryLocation?.area},{" "}
                        {rental.deliveryLocation?.city}
                    </Text>
                    {rental.deliveryLocation?.landmark && (
                        <Text style={styles.infoSub}>
                            Landmark: {rental.deliveryLocation.landmark}
                        </Text>
                    )}
                </View>

                <InputField
                    label="Delivery Date"
                    placeholder="YYYY-MM-DD"
                    value={deliveryDate}
                    onChangeText={setDeliveryDate}
                />
                <InputField
                    label="Delivery Time"
                    placeholder="e.g. 2:00 PM"
                    value={deliveryTime}
                    onChangeText={setDeliveryTime}
                />

                <Button
                    title="Schedule Delivery"
                    onPress={handleSchedule}
                    loading={loading}
                    style={{ marginTop: Spacing.md }}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
    scroll: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    backText: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: "600",
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: Colors.text,
        marginBottom: Spacing.lg,
    },
    infoCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.text,
        marginBottom: 4,
    },
    infoSub: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
});
