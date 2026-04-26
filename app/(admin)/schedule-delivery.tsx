import BookLoader from "@/components/ui/BookLoader";
import Button from "@/components/ui/Button";
import SlotDatePicker from "@/components/ui/SlotDatePicker";
import SlotTimePicker from "@/components/ui/SlotTimePicker";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useScheduleDeliveryScreen } from "@/hooks";
import { formatDateString, getValidDates, getValidTimeSlots } from "@/utils/timeSlots";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    RefreshControl,
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
    const [refreshing, setRefreshing] = React.useState(false);
    const {
        rental,
        deliveryDate,
        setDeliveryDate,
        deliveryTime,
        setDeliveryTime,
        loading,
        handleSchedule,
    } = useScheduleDeliveryScreen(rentalId);

    const availableDates = React.useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return getValidDates(today, 5);
    }, []);

    const availableTimeSlots = React.useMemo(() => {
        if (!deliveryDate) return [];
        const isToday = deliveryDate === formatDateString(new Date());
        return getValidTimeSlots(isToday);
    }, [deliveryDate]);

    // Auto-select first date and time slot
    React.useEffect(() => {
        if (availableDates.length > 0) {
            const isValidSetDate = availableDates.some(d => formatDateString(d) === deliveryDate);
            if (!deliveryDate || !isValidSetDate) {
                setDeliveryDate(formatDateString(availableDates[0]));
            }
        }
    }, [availableDates, deliveryDate, setDeliveryDate]);

    React.useEffect(() => {
        if (availableTimeSlots.length > 0 && !deliveryTime) {
            setDeliveryTime(availableTimeSlots[0]);
        } else if (availableTimeSlots.length > 0 && deliveryTime && !availableTimeSlots.includes(deliveryTime)) {
            setDeliveryTime(availableTimeSlots[0]);
        }
    }, [availableTimeSlots, deliveryTime, setDeliveryTime]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    if (!rental) {
        return (
            <View style={styles.center}>
                <BookLoader label="Loading rental..." />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.primary]}
                    />
                }
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Schedule Delivery</Text>
                    </View>
                </View>

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

                <SlotDatePicker
                    label="Delivery Date"
                    dates={availableDates}
                    selectedDate={deliveryDate}
                    onSelect={setDeliveryDate}
                />
                <SlotTimePicker
                    label="Delivery Time"
                    slots={availableTimeSlots}
                    selectedTime={deliveryTime}
                    onSelect={setDeliveryTime}
                    emptyMessage="No slots available for this date. Please select another date."
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    backBtn: {
        alignSelf: "flex-start",
        padding: 4,
        marginLeft: -4,
    },
    headerText: {
        flex: 1,
    },
    infoLine: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 4,
    },
    title: {
        fontSize: FontSizes.heading,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    infoCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    infoTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 4,
    },
    infoSub: {
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        marginTop: 2,
        fontFamily: Fonts.regular,
    },
});
