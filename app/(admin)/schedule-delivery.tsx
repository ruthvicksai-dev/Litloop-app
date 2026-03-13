import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Colors, Spacing } from "@/constants/theme";
import { useScheduleDeliveryScreen } from "@/hooks/useScheduleDeliveryScreen";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
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
    const router = useRouter();
    const {
        rental,
        deliveryDate,
        setDeliveryDate,
        deliveryTime,
        setDeliveryTime,
        loading,
        handleSchedule,
    } = useScheduleDeliveryScreen(rentalId);

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
                    <Text style={styles.backText}>â† Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Schedule Delivery</Text>

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>{rental.book?.title}</Text>
                    <Text style={styles.infoSub}>
                        For: {rental.user?.name} â€¢ {rental.user?.phone}
                    </Text>
                    <Text style={styles.infoSub}>
                        ðŸ“ {rental.zone} â€” {rental.deliveryLocation?.area}, {rental.deliveryLocation?.city}
                    </Text>
                    {rental.deliveryLocation?.landmark ? (
                        <Text style={styles.infoSub}>
                            Landmark: {rental.deliveryLocation.landmark}
                        </Text>
                    ) : null}
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
