import BookLoader from "@/components/ui/BookLoader";
import Button from "@/components/ui/Button";
import ConfirmActionModal from "@/components/ui/ConfirmActionModal";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Image,
    Linking,
    Platform,
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
    const rental = useQuery(api.rentals.getRental, { rentalId: id as Id<"rentals"> });
    const markDelivered = useMutation(api.rentals.markDelivered);
    const markReturned = useMutation(api.rentals.markReturned);

    const [loading, setLoading] = useState(false);
    const [actionModal, setActionModal] = useState<{
        visible: boolean;
        title: string;
        message: string;
        action: () => Promise<void>;
    }>({
        visible: false,
        title: "",
        message: "",
        action: async () => { },
    });

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

    const handleAction = async (title: string, message: string, action: () => Promise<void>) => {
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
        const { latitude, longitude } = rental.deliveryLocation;
        if (latitude && longitude) {
            const url = Platform.select({
                ios: `maps:0,0?q=${latitude},${longitude}`,
                android: `geo:0,0?q=${latitude},${longitude}`,
            });
            if (url) Linking.openURL(url);
        }
    };

    const renderTimelineStep = (label: string, subLabel: string, isDone: boolean, isActive: boolean, icon: keyof typeof Ionicons.glyphMap) => (
        <View style={styles.stepRow}>
            <View style={[styles.stepDot, isDone && styles.stepDotDone, isActive && styles.stepDotActive]}>
                <Ionicons
                    name={isDone ? (isActive ? icon : "checkmark") : icon}
                    size={14}
                    color={isDone ? Colors.white : Colors.textSecondary}
                />
            </View>
            <View style={styles.stepTextContainer}>
                <Text style={[styles.stepLabel, isDone && styles.stepLabelDone]}>{label}</Text>
                <Text style={styles.stepSubLabel}>{subLabel}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Details</Text>
                <View style={styles.idBadge}>
                    <Text style={styles.idText}>#{rental._id.slice(-6).toUpperCase()}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Amazon/Flipkart Style Timeline */}
                <View style={styles.timelineSection}>
                    <Text style={styles.sectionTitle}>Order Status</Text>
                    <View style={styles.timelineContainer}>
                        {renderTimelineStep(
                            "Order Placed",
                            `Requested on ${new Date(rental.createdAt).toLocaleDateString()}`,
                            ["requested", "delivery_scheduled", "delivered", "payment_pending", "paid", "returned"].includes(rental.status),
                            rental.status === "requested",
                            "receipt-outline"
                        )}
                        <View style={[styles.timelineLine, ["delivery_scheduled", "delivered", "payment_pending", "paid", "returned"].includes(rental.status) && styles.timelineLineActive]} />

                        {renderTimelineStep(
                            "Delivery Scheduled",
                            rental.deliveryDate ? `Scheduled for ${rental.deliveryDate}` : "Waiting for schedule",
                            ["delivery_scheduled", "delivered", "payment_pending", "paid", "returned"].includes(rental.status),
                            rental.status === "delivery_scheduled",
                            "calendar-outline"
                        )}
                        <View style={[styles.timelineLine, ["delivered", "payment_pending", "paid", "returned"].includes(rental.status) && styles.timelineLineActive]} />

                        {renderTimelineStep(
                            "Delivered",
                            rental.status === "delivered" || ["payment_pending", "paid", "returned"].includes(rental.status) ? "Order delivered successfully" : "Pending delivery",
                            ["delivered", "payment_pending", "paid", "returned"].includes(rental.status),
                            rental.status === "delivered" || rental.status === "payment_pending",
                            "bicycle-outline"
                        )}
                        <View style={[styles.timelineLine, ["paid", "returned"].includes(rental.status) && styles.timelineLineActive]} />

                        {renderTimelineStep(
                            "Completed",
                            rental.status === "returned" || rental.status === "paid" ? "Transaction finished" : "Pending return & verification",
                            ["paid", "returned"].includes(rental.status),
                            rental.status === "paid" || rental.status === "returned",
                            "checkbox-outline"
                        )}
                    </View>
                </View>

                {/* Section: Book Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Book Information</Text>
                    <View style={styles.bookCard}>
                        {coverUri ? (
                            <Image source={{ uri: coverUri }} style={styles.bookCover} />
                        ) : (
                            <View style={styles.bookPlaceholder}>
                                <Ionicons name="book" size={32} color={Colors.border} />
                            </View>
                        )}
                        <View style={styles.bookDetails}>
                            <Text style={styles.bookTitle} numberOfLines={2}>{rental.book?.title}</Text>
                            <Text style={styles.bookAuthor}>{rental.book?.author}</Text>
                            <View style={styles.priceTag}>
                                <Text style={styles.priceText}>₹{rental.rentPerDay}/day</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Section: User Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Customer Details</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
                            <Text style={styles.infoValue}>{rental.user?.name}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
                            <Text style={styles.infoValue}>{rental.user?.email}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="call-outline" size={18} color={Colors.textSecondary} />
                            <Text style={styles.infoValue}>{rental.user?.phone}</Text>
                        </View>
                    </View>
                </View>

                {/* Section: Delivery Details */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Delivery Details</Text>
                        <View style={styles.zoneBadge}>
                            <Text style={styles.zoneText}>{rental.zone}</Text>
                        </View>
                    </View>
                    <View style={styles.infoCard}>
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
                                        <Ionicons name="map" size={18} color={Colors.white} />
                                        <Text style={styles.mapBtnText}>Open in Maps</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        {rental.deliveryDate && (
                            <View style={styles.scheduleInfo}>
                                <Ionicons name="time-outline" size={16} color={Colors.primary} />
                                <Text style={styles.scheduleText}>
                                    Scheduled: {rental.deliveryDate} at {rental.deliveryTime}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Section: Pickup Details */}
                {rental.pickupLocation && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Pickup Details</Text>
                            <View style={[styles.zoneBadge, { backgroundColor: Colors.success }]}>
                                <Text style={styles.zoneText}>Collection</Text>
                            </View>
                        </View>
                        <View style={styles.infoCard}>
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
                                            style={[styles.mapBtn, { backgroundColor: Colors.success }]}
                                            onPress={() => {
                                                const { latitude, longitude } = rental.pickupLocation!;
                                                const url = Platform.select({
                                                    ios: `maps:0,0?q=${latitude},${longitude}`,
                                                    android: `geo:0,0?q=${latitude},${longitude}`,
                                                });
                                                if (url) Linking.openURL(url);
                                            }}
                                        >
                                            <Ionicons name="map" size={18} color={Colors.white} />
                                            <Text style={styles.mapBtnText}>Open Pickup in Maps</Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}

                            <View style={styles.infoRow}>
                                <Ionicons name="call-outline" size={18} color={Colors.success} />
                                <Text style={[styles.infoValue, { color: Colors.success }]}>{rental.pickupLocation.phone}</Text>
                            </View>

                            {rental.pickupDate && (
                                <View style={[styles.scheduleInfo, { borderTopColor: Colors.success + "20" }]}>
                                    <Ionicons name="calendar-outline" size={16} color={Colors.success} />
                                    <Text style={[styles.scheduleText, { color: Colors.success }]}>
                                        Collection: {rental.pickupDate} at {rental.pickupTime}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Section: Payment & Fees */}
                {(rental.totalRent !== undefined || rental.paymentStatus) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment & Fees</Text>
                        <View style={styles.infoCard}>
                            {rental.totalRent !== undefined && (
                                <View style={styles.gridRow}>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>Total Rent</Text>
                                        <Text style={[styles.gridValue, { color: Colors.success, fontFamily: Fonts.bold }]}>
                                            ₹{rental.totalRent}
                                        </Text>
                                    </View>
                                    {rental.lateFee !== undefined && (
                                        <View style={styles.gridItem}>
                                            <Text style={styles.gridLabel}>Late Fee</Text>
                                            <Text style={[styles.gridValue, { color: Colors.error }]}>
                                                ₹{rental.lateFee}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            <View style={styles.gridRow}>
                                {rental.paymentMethod && (
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>Method</Text>
                                        <Text style={styles.gridValue}>{rental.paymentMethod.toUpperCase()}</Text>
                                    </View>
                                )}
                                {rental.paymentStatus && (
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>Payment Status</Text>
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
                                <View style={styles.screenshotSection}>
                                    <Text style={styles.gridLabel}>Payment Screenshot</Text>
                                    <TouchableOpacity
                                        onPress={() => Linking.openURL(rental.screenshotUrl!)}
                                        style={styles.screenshotWrap}
                                    >
                                        <Image source={{ uri: rental.screenshotUrl }} style={styles.screenshot} resizeMode="contain" />
                                        <View style={styles.screenshotOverlay}>
                                            <Ionicons name="expand" size={20} color={Colors.white} />
                                            <Text style={styles.screenshotOverlayText}>Tap to Expand</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
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
                                    markDelivered({ rentalId: rental._id });
                                    return Promise.resolve();
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
                                    markReturned({ rentalId: rental._id });
                                    return Promise.resolve();
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
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        flex: 1,
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginLeft: 10,
    },
    idBadge: {
        backgroundColor: Colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    idText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
    },
    scroll: {
        paddingBottom: 40,
    },
    timelineSection: {
        padding: 20,
        backgroundColor: Colors.white,
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 20,
        marginBottom: 25,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    timelineContainer: {
        marginTop: 10,
    },
    stepRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    stepDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.background,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: Colors.border,
        zIndex: 2,
    },
    stepDotDone: {
        backgroundColor: Colors.success,
        borderColor: Colors.success,
    },
    stepDotActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        transform: [{ scale: 1.1 }],
    },
    timelineLine: {
        width: 2,
        height: 30,
        backgroundColor: Colors.border,
        marginLeft: 13,
        zIndex: 1,
        marginVertical: -2,
    },
    timelineLineActive: {
        backgroundColor: Colors.success,
    },
    stepTextContainer: {
        marginLeft: 15,
        flex: 1,
        paddingBottom: 5,
    },
    stepLabel: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    stepLabelDone: {
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    stepSubLabel: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 12,
    },
    sectionHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    bookCard: {
        flexDirection: "row",
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 12,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    bookCover: {
        width: 60,
        aspectRatio: 2 / 3,
        borderRadius: 8,
    },
    bookPlaceholder: {
        width: 60,
        aspectRatio: 2 / 3,
        borderRadius: 8,
        backgroundColor: Colors.background,
        justifyContent: "center",
        alignItems: "center",
    },
    bookDetails: {
        flex: 1,
        marginLeft: 15,
        justifyContent: "center",
    },
    bookTitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 4,
    },
    bookAuthor: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    priceTag: {
        alignSelf: "flex-start",
        backgroundColor: Colors.primary + "10",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    priceText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    infoCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        gap: 12,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    infoValue: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    zoneBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 99,
    },
    zoneText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        color: Colors.white,
    },
    gridRow: {
        flexDirection: "row",
        gap: 15,
    },
    gridItem: {
        flex: 1,
    },
    gridLabel: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    gridValue: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    addressText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
        lineHeight: 22,
    },
    mapBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.primary,
        alignSelf: "flex-start",
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 8,
        marginTop: 5,
    },
    mapBtnText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.white,
    },
    scheduleInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 5,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    scheduleText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.primary,
    },
    actionSection: {
        paddingHorizontal: 20,
        marginTop: 10,
    },
    errorText: {
        fontSize: FontSizes.body,
        color: Colors.error,
        fontFamily: Fonts.bold,
    },
    screenshotSection: {
        marginTop: 5,
    },
    screenshotWrap: {
        width: "100%",
        aspectRatio: 3 / 4,
        borderRadius: 12,
        backgroundColor: Colors.background,
        overflow: "hidden",
        marginTop: 8,
    },
    screenshot: {
        width: "100%",
        height: "100%",
    },
    screenshotOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        alignItems: "center",
        gap: 5,
    },
    screenshotOverlayText: {
        color: Colors.white,
        fontSize: 10,
        fontFamily: Fonts.bold,
    },
});
