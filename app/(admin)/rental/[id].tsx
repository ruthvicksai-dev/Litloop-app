import BookLoader from "@/components/ui/feedback/BookLoader";
import Button from "@/components/ui/core/Button";
import ConfirmActionModal from "@/components/ui/feedback/ConfirmActionModal";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing, Layout, RENTAL_STATUS_LABELS, STATUS_COLORS } from "@/constants/theme";
import { useAuthState } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import AdminHeader from "@/components/admin/AdminHeader";
import React, { useState } from "react";
import {
    Image,
    Linking,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
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

    const openMap = () => {
        triggerHaptic("light");
        const { latitude, longitude } = rental.deliveryLocation;
        if (latitude && longitude) {
            const url = Platform.select({
                ios: `maps:0,0?q=${latitude},${longitude}`,
                android: `geo:0,0?q=${latitude},${longitude}`,
            });
            if (url) Linking.openURL(url);
        }
    };

    const STATUS_FLOW = ["requested", "delivery_scheduled", "delivered", "payment_pending", "paid", "returned"];
    const currentIndex = STATUS_FLOW.indexOf(rental.status);
    const statusColor = STATUS_COLORS[rental.status] || Colors.textSecondary;
    const statusLabel = RENTAL_STATUS_LABELS[rental.status] || rental.status;

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
                {/* Status Banner */}
                <View style={styles.statusBanner}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
                    <Text style={styles.statusDate}>
                        {new Date(rental.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </Text>
                </View>

                {/* Horizontal Timeline Stepper */}
                <View style={styles.stepperRow}>
                    {STATUS_FLOW.map((step, i) => {
                        const isDone = i <= currentIndex;
                        const isCurrent = i === currentIndex;
                        return (
                            <React.Fragment key={step}>
                                <View style={styles.stepperDotWrap}>
                                    <View style={[
                                        styles.stepperDot,
                                        isDone && { backgroundColor: Colors.success, borderColor: Colors.success },
                                        isCurrent && { backgroundColor: statusColor, borderColor: statusColor, transform: [{ scale: 1.2 }] },
                                    ]}>
                                        {isDone && !isCurrent && <Ionicons name="checkmark" size={10} color={Colors.white} />}
                                        {isCurrent && <View style={styles.stepperDotInner} />}
                                    </View>
                                    {isCurrent && (
                                        <Text style={styles.stepperLabel} numberOfLines={1}>
                                            {RENTAL_STATUS_LABELS[step]?.split(" ")[0]}
                                        </Text>
                                    )}
                                </View>
                                {i < STATUS_FLOW.length - 1 && (
                                    <View style={[styles.stepperLine, i < currentIndex && { backgroundColor: Colors.success }]} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </View>

                {/* Book Info - Tappable Row */}
                <TouchableOpacity 
                    style={styles.bookRow}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/(admin)/book-details?bookId=${rental.bookId}`)}
                >
                    {coverUri ? (
                        <ExpoImage source={{ uri: coverUri }} style={styles.bookCover} cachePolicy="disk" />
                    ) : (
                        <View style={styles.bookPlaceholder}>
                            <Ionicons name="book" size={28} color={Colors.textLight} />
                        </View>
                    )}
                    <View style={styles.bookMeta}>
                        <Text style={styles.bookTitle} numberOfLines={2}>{rental.book?.title}</Text>
                        <Text style={styles.bookAuthor}>{rental.book?.author}</Text>
                        <Text style={styles.bookPrice}>₹{rental.rentPerDay}/day</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                </TouchableOpacity>

                {/* Customer */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Customer</Text>
                    <View style={styles.detailRow}>
                        <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
                        <Text style={styles.detailValue}>{rental.user?.name}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="mail-outline" size={16} color={Colors.textSecondary} />
                        <Text style={styles.detailValue}>{rental.user?.email}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="call-outline" size={16} color={Colors.textSecondary} />
                        <Text style={styles.detailValue}>{rental.user?.phone}</Text>
                    </View>
                </View>

                {/* Delivery */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionLabel}>Delivery</Text>
                        <View style={[styles.badge, { backgroundColor: Colors.primary + "18" }]}>
                            <Text style={[styles.badgeText, { color: Colors.primary }]}>{rental.zone}</Text>
                        </View>
                    </View>
                    {rental.zone === "College" ? (
                        <>
                            <View style={styles.gridRow}>
                                <View style={styles.gridItem}>
                                    <Text style={styles.gridLabel}>Room No</Text>
                                    <Text style={styles.gridValue}>{rental.deliveryLocation.roomNo}</Text>
                                </View>
                                <View style={styles.gridItem}>
                                    <Text style={styles.gridLabel}>Roll No</Text>
                                    <Text style={styles.gridValue}>{rental.deliveryLocation.rollNo}</Text>
                                </View>
                            </View>
                            <View style={styles.gridRow}>
                                <View style={styles.gridItem}>
                                    <Text style={styles.gridLabel}>Department</Text>
                                    <Text style={styles.gridValue}>{rental.deliveryLocation.department || "N/A"}</Text>
                                </View>
                                <View style={styles.gridItem}>
                                    <Text style={styles.gridLabel}>Year</Text>
                                    <Text style={styles.gridValue}>{rental.deliveryLocation.yearOfStudy || "N/A"}</Text>
                                </View>
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={styles.addressText}>
                                {rental.deliveryLocation.formattedAddress ||
                                    `${rental.deliveryLocation.area}, ${rental.deliveryLocation.city}`}
                            </Text>
                            {rental.deliveryLocation.latitude && (
                                <TouchableOpacity style={styles.mapBtn} onPress={openMap}>
                                    <Ionicons name="navigate-outline" size={14} color={Colors.primary} />
                                    <Text style={styles.mapBtnText}>Open in Maps</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                    {rental.deliveryDate && (
                        <View style={styles.scheduleRow}>
                            <Ionicons name="time-outline" size={14} color={Colors.primary} />
                            <Text style={styles.scheduleText}>{rental.deliveryDate} at {rental.deliveryTime}</Text>
                        </View>
                    )}
                </View>

                {/* Pickup */}
                {rental.pickupLocation && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionLabel}>Pickup</Text>
                            <View style={[styles.badge, { backgroundColor: Colors.success + "18" }]}>
                                <Text style={[styles.badgeText, { color: Colors.success }]}>Collection</Text>
                            </View>
                        </View>
                        {rental.zone === "College" ? (
                            <>
                                <View style={styles.gridRow}>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>Room No</Text>
                                        <Text style={styles.gridValue}>{rental.pickupLocation.roomNo || "N/A"}</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>Roll No</Text>
                                        <Text style={styles.gridValue}>{rental.pickupLocation.rollNo || "N/A"}</Text>
                                    </View>
                                </View>
                                <View style={styles.gridRow}>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>Department</Text>
                                        <Text style={styles.gridValue}>{rental.pickupLocation.department || "N/A"}</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>Year</Text>
                                        <Text style={styles.gridValue}>{rental.pickupLocation.yearOfStudy || "N/A"}</Text>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={styles.addressText}>
                                    {rental.pickupLocation.formattedAddress ||
                                        (rental.pickupLocation.area ? `${rental.pickupLocation.area}, ${rental.pickupLocation.city}` : "Delivery Address Reused")}
                                </Text>
                                {rental.pickupLocation.latitude && (
                                    <TouchableOpacity
                                        style={styles.mapBtn}
                                        onPress={() => {
                                            const { latitude, longitude } = rental.pickupLocation!;
                                            const url = Platform.select({
                                                ios: `maps:0,0?q=${latitude},${longitude}`,
                                                android: `geo:0,0?q=${latitude},${longitude}`,
                                            });
                                            if (url) Linking.openURL(url);
                                        }}
                                    >
                                        <Ionicons name="navigate-outline" size={14} color={Colors.success} />
                                        <Text style={[styles.mapBtnText, { color: Colors.success }]}>Open in Maps</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                        <View style={styles.detailRow}>
                            <Ionicons name="call-outline" size={16} color={Colors.success} />
                            <Text style={[styles.detailValue, { color: Colors.success }]}>{rental.pickupLocation.phone}</Text>
                        </View>
                        {rental.pickupDate && (
                            <View style={styles.scheduleRow}>
                                <Ionicons name="calendar-outline" size={14} color={Colors.success} />
                                <Text style={[styles.scheduleText, { color: Colors.success }]}>{rental.pickupDate} at {rental.pickupTime}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Payment & Fees */}
                {(rental.totalRent !== undefined || rental.paymentStatus) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Payment & Fees</Text>
                        <View style={styles.gridRow}>
                            {rental.totalRent !== undefined && (
                                <View style={styles.gridItem}>
                                    <Text style={styles.gridLabel}>Total Rent</Text>
                                    <Text style={[styles.gridValue, { color: Colors.success, fontFamily: Fonts.bold }]}>₹{rental.totalRent}</Text>
                                </View>
                            )}
                            {rental.lateFee !== undefined && (
                                <View style={styles.gridItem}>
                                    <Text style={styles.gridLabel}>Late Fee</Text>
                                    <Text style={[styles.gridValue, { color: Colors.error }]}>₹{rental.lateFee}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.gridRow}>
                            {rental.paymentMethod && (
                                <View style={styles.gridItem}>
                                    <Text style={styles.gridLabel}>Method</Text>
                                    <Text style={styles.gridValue}>{rental.paymentMethod.toUpperCase()}</Text>
                                </View>
                            )}
                            {rental.paymentStatus && (
                                <View style={styles.gridItem}>
                                    <Text style={styles.gridLabel}>Status</Text>
                                    <Text style={[styles.gridValue, { color: rental.paymentStatus === "paid" ? Colors.success : Colors.warning }]}>
                                        {rental.paymentStatus.replace("_", " ").toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </View>
                        {rental.utrNumber && (
                            <View style={styles.gridItem}>
                                <Text style={styles.gridLabel}>UTR Number</Text>
                                <Text style={styles.gridValue}>{rental.utrNumber}</Text>
                            </View>
                        )}
                        {rental.screenshotUrl && (
                            <TouchableOpacity onPress={() => Linking.openURL(rental.screenshotUrl!)} style={styles.screenshotWrap}>
                                <Image source={{ uri: rental.screenshotUrl }} style={styles.screenshot} resizeMode="cover" />
                                <View style={styles.screenshotOverlay}>
                                    <Ionicons name="expand" size={18} color={Colors.white} />
                                    <Text style={styles.screenshotOverlayText}>Tap to view</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.actionSection}>
                    {rental.status === "requested" && (
                        <Button
                            title="Schedule Delivery"
                            onPress={() => router.push(`/(admin)/schedule-delivery?rentalId=${rental._id}`)}
                            variant="primary"
                        />
                    )}
                    {rental.status === "delivery_scheduled" && (
                        <Button
                            title="Mark as Delivered"
                            onPress={() => handleAction(
                                "Mark Delivered?",
                                "Are you sure you have delivered this book to the customer?",
                                () => {
                                    if (!accessToken) return Promise.reject(new Error("Unauthenticated"));
                                    return markDelivered({ accessToken, rentalId: rental._id });
                                }
                            )}
                            variant="primary"
                        />
                    )}
                    {rental.status === "payment_pending" && (
                        <Button
                            title="Verify Payment"
                            onPress={() => router.push(`/(admin)/verify-payment?rentalId=${rental._id}`)}
                            variant="primary"
                        />
                    )}
                    {rental.status === "paid" && (
                        <Button
                            title="Mark as Returned"
                            onPress={() => handleAction(
                                "Mark Returned?",
                                "Confirm that the book has been received back in good condition and payment is verified.",
                                () => {
                                    if (!accessToken) return Promise.reject(new Error("Unauthenticated"));
                                    return markReturned({ accessToken, rentalId: rental._id });
                                }
                            )}
                            variant="primary"
                        />
                    )}
                </View>
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
    idBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    idText: { fontSize: FontSizes.tiny, fontFamily: Fonts.bold, color: Colors.primary },
    scroll: { paddingBottom: 40 },
    statusBanner: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, marginTop: Spacing.sm },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.sm },
    statusLabel: { fontSize: FontSizes.subtitle, fontFamily: Fonts.bold, flex: 1 },
    statusDate: { fontSize: FontSizes.caption, fontFamily: Fonts.regular, color: Colors.textSecondary },
    stepperRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
    stepperDotWrap: { alignItems: "center" },
    stepperDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.border, borderWidth: 2, borderColor: Colors.border, justifyContent: "center", alignItems: "center" },
    stepperDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.white },
    stepperLabel: { fontSize: 9, fontFamily: Fonts.bold, color: Colors.textSecondary, marginTop: 4 },
    stepperLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 2 },
    bookRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    bookCover: { width: 50, aspectRatio: 2 / 3, borderRadius: 6 },
    bookPlaceholder: { width: 50, aspectRatio: 2 / 3, borderRadius: 6, backgroundColor: Colors.primaryLight, justifyContent: "center", alignItems: "center" },
    bookMeta: { flex: 1, marginLeft: Spacing.md },
    bookTitle: { fontSize: FontSizes.body, fontFamily: Fonts.bold, color: Colors.text, marginBottom: 2 },
    bookAuthor: { fontSize: FontSizes.caption, fontFamily: Fonts.regular, color: Colors.textSecondary, marginBottom: 4 },
    bookPrice: { fontSize: FontSizes.caption, fontFamily: Fonts.bold, color: Colors.primary },
    section: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm },
    sectionLabel: { fontSize: FontSizes.caption, fontFamily: Fonts.bold, color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
    sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
    badgeText: { fontSize: FontSizes.tiny, fontFamily: Fonts.bold },
    detailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    detailValue: { fontSize: FontSizes.body, fontFamily: Fonts.medium, color: Colors.text, flex: 1 },
    gridRow: { flexDirection: "row", gap: Spacing.md },
    gridItem: { flex: 1 },
    gridLabel: { fontSize: FontSizes.tiny, fontFamily: Fonts.bold, color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
    gridValue: { fontSize: FontSizes.body, fontFamily: Fonts.medium, color: Colors.text },
    addressText: { fontSize: FontSizes.body, fontFamily: Fonts.regular, color: Colors.text, lineHeight: 22 },
    mapBtn: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, marginTop: 4 },
    mapBtnText: { fontSize: FontSizes.caption, fontFamily: Fonts.bold, color: Colors.primary },
    scheduleRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: Spacing.sm, marginTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border },
    scheduleText: { fontSize: FontSizes.caption, fontFamily: Fonts.medium, color: Colors.primary },
    actionSection: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
    errorText: { fontSize: FontSizes.body, color: Colors.error, fontFamily: Fonts.bold },
    screenshotWrap: { width: "100%", aspectRatio: 4 / 3, borderRadius: Layout.borderRadius, backgroundColor: Colors.primaryLight, overflow: "hidden", marginTop: Spacing.sm },
    screenshot: { width: "100%", height: "100%" },
    screenshotOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "center", alignItems: "center", gap: 4 },
    screenshotOverlayText: { color: Colors.white, fontSize: FontSizes.tiny, fontFamily: Fonts.bold },
});
