import AdminHeader from "@/components/admin/core/AdminHeader";
import RentalActionButtons from "@/components/admin/rentals/detail/RentalActionButtons";
import RentalBookCard from "@/components/admin/rentals/detail/RentalBookCard";
import RentalCustomerCard from "@/components/admin/rentals/detail/RentalCustomerCard";
import RentalLocationCard from "@/components/admin/rentals/detail/RentalLocationCard";
import RentalPaymentCard from "@/components/admin/rentals/detail/RentalPaymentCard";
import RentalStatusBanner from "@/components/admin/rentals/detail/RentalStatusBanner";
import RentalTimelineStepper from "@/components/admin/rentals/detail/RentalTimelineStepper";
import Button from "@/components/ui/core/Button";
import BookLoader from "@/components/ui/feedback/BookLoader";
import ConfirmActionModal from "@/components/ui/feedback/ConfirmActionModal";
import { FontSizes, Fonts } from "@/constants/fonts";
import { Colors, RENTAL_STATUS_LABELS, STATUS_COLORS } from "@/constants/theme";
import { useAuthState } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { triggerHaptic } from "@/utils";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminRentalDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { accessToken } = useAuthState();
    const rental = useQuery(api.rentals.getRental, accessToken ? { accessToken, rentalId: id as Id<"rentals"> } : "skip");
    const markDelivered = useMutation(api.rentals.markDelivered);
    const markReturned = useMutation(api.rentals.markReturned);

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [actionModal, setActionModal] = useState<{
        visible: boolean;
        title: string;
        message: string;
        action: () => Promise<any>;
    }>({
        visible: false,
        title: "",
        message: "",
        action: async () => { },
    });

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        triggerHaptic("light");
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    if (rental === undefined) {
        return (
            <View style={styles.center}>
                <BookLoader label="Fetching order details..." />
            </View>
        );
    }

    if (!rental) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Order not found</Text>
                <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
            </View>
        );
    }

    const coverUri = rental.coverUrl || rental.coverUrls?.[0] || null;

    const handleAction = async (title: string, message: string, action: () => Promise<any>) => {
        triggerHaptic("medium");
        setActionModal({
            visible: true,
            title,
            message,
            action,
        });
    };

    const executeAction = async () => {
        setLoading(true);
        try {
            await actionModal.action();
            setActionModal((prev) => ({ ...prev, visible: false }));
        } catch (error) {
            console.error("Action failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const STATUS_FLOW = ["requested", "delivery_scheduled", "delivered", "payment_pending", "paid", "returned"];
    const currentIndex = STATUS_FLOW.indexOf(rental.status);
    const statusColor = STATUS_COLORS[rental.status as keyof typeof STATUS_COLORS] || Colors.textSecondary;
    const statusLabel = RENTAL_STATUS_LABELS[rental.status as keyof typeof RENTAL_STATUS_LABELS] || rental.status;

    return (
        <SafeAreaView style={styles.container}>
            <AdminHeader title="Order Details" />

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.primary]}
                    />
                }
            >
                <RentalStatusBanner 
                    statusColor={statusColor} 
                    statusLabel={statusLabel} 
                    createdAt={rental.createdAt} 
                />

                <RentalTimelineStepper 
                    currentIndex={currentIndex} 
                    statusColor={statusColor} 
                />

                <RentalBookCard 
                    bookId={rental.bookId}
                    coverUri={coverUri}
                    title={rental.book?.title}
                    author={rental.book?.author}
                    rentPerDay={rental.rentPerDay}
                />

                <RentalCustomerCard 
                    name={rental.user?.name}
                    email={rental.user?.email}
                    phone={rental.user?.phone}
                />

                <RentalLocationCard 
                    type="Delivery"
                    zone={rental.zone}
                    location={rental.deliveryLocation as any}
                    date={rental.deliveryDate}
                    time={rental.deliveryTime}
                />

                {rental.pickupLocation && (
                    <RentalLocationCard 
                        type="Pickup"
                        zone={rental.zone}
                        location={rental.pickupLocation as any}
                        date={rental.pickupDate}
                        time={rental.pickupTime}
                    />
                )}

                <RentalPaymentCard 
                    totalRent={rental.totalRent}
                    lateFee={rental.lateFee}
                    paymentMethod={rental.paymentMethod}
                    paymentStatus={rental.paymentStatus}
                    utrNumber={rental.utrNumber}
                    screenshotUrl={rental.screenshotUrl}
                />

                <RentalActionButtons 
                    status={rental.status}
                    rentalId={rental._id}
                    onMarkDelivered={() => handleAction(
                        "Mark Delivered?",
                        "Are you sure you have delivered this book to the customer?",
                        () => {
                            if (!accessToken) return Promise.reject(new Error("Unauthenticated"));
                            return markDelivered({ accessToken, rentalId: rental._id });
                        }
                    )}
                    onMarkReturned={() => handleAction(
                        "Mark Returned?",
                        "Confirm that the book has been received back in good condition and payment is verified.",
                        () => {
                            if (!accessToken) return Promise.reject(new Error("Unauthenticated"));
                            return markReturned({ accessToken, rentalId: rental._id });
                        }
                    )}
                />
            </ScrollView>

            <ConfirmActionModal
                visible={actionModal.visible}
                title={actionModal.title}
                message={actionModal.message}
                confirmLabel="Confirm"
                cancelLabel="Cancel"
                onCancel={() => setActionModal(prev => ({ ...prev, visible: false }))}
                onConfirm={executeAction}
                loading={loading}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    scroll: { paddingBottom: 40 },
    errorText: { fontSize: FontSizes.body, color: Colors.error, fontFamily: Fonts.bold },
});
