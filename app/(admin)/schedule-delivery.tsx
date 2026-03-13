import Button from "@/components/ui/Button";
import DatePickerField from "@/components/ui/DatePickerField";
import TimePickerField from "@/components/ui/TimePickerField";
import { Colors, Spacing } from "@/constants/theme";
import { useScheduleDeliveryScreen } from "@/hooks/useScheduleDeliveryScreen";
import { Ionicons } from "@expo/vector-icons";
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDeliveryDate = new Date(today);
    maxDeliveryDate.setDate(today.getDate() + 9);

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
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>

                <Text style={styles.title}>Schedule Delivery</Text>

<View style={styles.infoCard}>
    <Text style={styles.infoTitle}>{rental.book?.title}</Text>

    {/* User name */}
    <View style={styles.infoLine}>
        <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.infoSub}>{rental.user?.name}</Text>
    </View>

    {/* Phone */}
    <View style={styles.infoLine}>
        <Ionicons name="call-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.infoSub}>{rental.user?.phone}</Text>
    </View>

    {/* Location */}
    <View style={styles.infoLine}>
        <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.infoSub}>
            {rental.zone} {rental.deliveryLocation?.area}, {rental.deliveryLocation?.city}
        </Text>
    </View>

    {/* Landmark */}
    {rental.deliveryLocation?.landmark ? (
        <View style={styles.infoLine}>
            <Ionicons name="navigate-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.infoSub}>
                {rental.deliveryLocation.landmark}
            </Text>
        </View>
    ) : null}
</View>

                <DatePickerField
                    label="Delivery Date"
                    placeholder="Select delivery date"
                    value={deliveryDate}
                    minimumDate={today}
                    maximumDate={maxDeliveryDate}
                    onChange={setDeliveryDate}
                />
                <TimePickerField
                    label="Delivery Time"
                    placeholder="Select delivery time"
                    value={deliveryTime}
                    onChange={setDeliveryTime}
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
    backBtn: {
        marginBottom: Spacing.md,
        alignSelf: "flex-start",
        padding: 4,
        marginLeft: -4,
    },
    backText: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: "600",
        marginBottom: Spacing.md,
    },
    infoLine: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 4,
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
