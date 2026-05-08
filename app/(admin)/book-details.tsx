import BookImageCarousel from "@/components/books/BookImageCarousel";
import BookReviews from "@/components/books/BookReviews";
import ConfirmActionModal from "@/components/ui/feedback/ConfirmActionModal";
import BookLoader from "@/components/ui/feedback/BookLoader";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing, RENTAL_STATUS_LABELS, STATUS_COLORS } from "@/constants/theme";
import { useAdminBookDetailsScreen } from "@/hooks";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminBookDetailsScreen() {
    const { bookId } = useLocalSearchParams<{ bookId: string }>();
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(0);

    const {
        book,
        reviews,
        reviewSummary,
        bookRentals,
        images,
        borrowedCopies,
        inventoryStatus,
        deleteTarget,
        deleting,
        inventoryValue,
        setInventoryValue,
        updatingInventory,
        isDescriptionExpanded,
        setIsDescriptionExpanded,
        handleDeletePress,
        confirmDelete,
        cancelDelete,
        handleUpdateInventory,
        fadeAnim,
        slideAnim,
    } = useAdminBookDetailsScreen(bookId);

    const handleConfirmDelete = async () => {
        const success = await confirmDelete();
        if (success) {
            router.back();
        } else {
            Alert.alert("Error", "Failed to delete book.");
        }
    };

    const handleInventorySave = async () => {
        const success = await handleUpdateInventory();
        if (success) {
            Alert.alert("Success", "Inventory updated successfully.");
        } else {
            Alert.alert("Error", "Please enter a valid number.");
        }
    };

    // Loading state
    if (book === undefined) {
        return (
            <View style={styles.center}>
                <BookLoader label="Loading book details..." />
            </View>
        );
    }

    // Not found state
    if (book === null) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Book Details</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.center}>
                    <Ionicons name="book-outline" size={60} color={Colors.textLight} style={{ marginBottom: Spacing.md }} />
                    <Text style={styles.emptyTitle}>Book not found</Text>
                    <Text style={styles.emptySubtitle}>This book may have been removed.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const genre = book.genre ?? book.genres?.[0] ?? "General";

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <Animated.View
                style={[
                    styles.header,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Book Details</Text>
                <View style={styles.headerSpacer} />
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Book Cover Carousel */}
                <BookImageCarousel
                    images={images}
                    activeIndex={activeIndex}
                    onIndexChange={setActiveIndex}
                    isUnavailable={book.availableCopies === 0}
                />

                {/* Book Information Section */}
                <Animated.View
                    style={[
                        styles.infoSection,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    <Text style={styles.bookTitle}>{book.title}</Text>
                    <Text style={styles.bookAuthor}>by {book.author}</Text>

                    <View style={styles.badgeRow}>
                        <View style={styles.genreBadge}>
                            <Text style={styles.genreBadgeText}>{genre}</Text>
                        </View>
                        <View style={[
                            styles.statusBadge,
                            { backgroundColor: book.availableCopies > 0 ? Colors.success + "18" : Colors.error + "18" },
                        ]}>
                            <View style={[
                                styles.statusDot,
                                { backgroundColor: book.availableCopies > 0 ? Colors.success : Colors.error },
                            ]} />
                            <Text style={[
                                styles.statusBadgeText,
                                { color: book.availableCopies > 0 ? Colors.success : Colors.error },
                            ]}>
                                {book.availableCopies > 0 ? "Available" : "Out of Stock"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.priceRow}>
                        <Ionicons name="pricetag-outline" size={18} color={Colors.primary} />
                        <Text style={styles.priceText}>₹{book.rentPerDay}/day</Text>
                    </View>

                    {/* Description */}
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionLabel}>Description</Text>
                        <Text
                            style={styles.descriptionText}
                            numberOfLines={isDescriptionExpanded ? undefined : 3}
                        >
                            {book.description}
                        </Text>
                        {book.description.length > 140 && (
                            <TouchableOpacity
                                onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.toggleText}>
                                    {isDescriptionExpanded ? "View less" : "View more"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Inventory Section */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeaderRow}>
                            <Ionicons name="library-outline" size={20} color={Colors.primary} />
                            <Text style={styles.sectionLabel}>Inventory</Text>
                            <View style={[
                                styles.inventoryBadge,
                                {
                                    backgroundColor:
                                        inventoryStatus === "out_of_stock" ? Colors.error + "18" :
                                            inventoryStatus === "low_stock" ? Colors.warning + "18" :
                                                Colors.success + "18",
                                },
                            ]}>
                                <Text style={[
                                    styles.inventoryBadgeText,
                                    {
                                        color:
                                            inventoryStatus === "out_of_stock" ? Colors.error :
                                                inventoryStatus === "low_stock" ? Colors.warning :
                                                    Colors.success,
                                    },
                                ]}>
                                    {inventoryStatus === "out_of_stock" ? "Out of Stock" :
                                        inventoryStatus === "low_stock" ? "Low Stock" :
                                            "In Stock"}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.inventoryGrid}>
                            <View style={styles.inventoryItem}>
                                <Text style={styles.inventoryNumber}>{book.totalCopies}</Text>
                                <Text style={styles.inventoryLabel}>Total</Text>
                            </View>
                            <View style={styles.inventoryDivider} />
                            <View style={styles.inventoryItem}>
                                <Text style={[styles.inventoryNumber, { color: Colors.success }]}>{book.availableCopies}</Text>
                                <Text style={styles.inventoryLabel}>Available</Text>
                            </View>
                            <View style={styles.inventoryDivider} />
                            <View style={styles.inventoryItem}>
                                <Text style={[styles.inventoryNumber, { color: Colors.warning }]}>{borrowedCopies}</Text>
                                <Text style={styles.inventoryLabel}>Borrowed</Text>
                            </View>
                        </View>

                        {/* Quick Update Inventory */}
                        <View style={styles.inventoryUpdateRow}>
                            <TextInput
                                style={styles.inventoryInput}
                                placeholder="New total copies"
                                placeholderTextColor={Colors.textLight}
                                keyboardType="number-pad"
                                value={inventoryValue}
                                onChangeText={setInventoryValue}
                            />
                            <TouchableOpacity
                                style={[styles.inventoryUpdateBtn, updatingInventory && { opacity: 0.6 }]}
                                onPress={handleInventorySave}
                                disabled={updatingInventory || !inventoryValue.trim()}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="checkmark" size={18} color={Colors.white} />
                                <Text style={styles.inventoryUpdateBtnText}>
                                    {updatingInventory ? "Saving..." : "Update"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Reviews Section — reuses the existing BookReviews component */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeaderRow}>
                            <Ionicons name="chatbubbles-outline" size={20} color={Colors.primary} />
                            <Text style={styles.sectionLabel}>Reviews</Text>
                        </View>
                        <BookReviews bookId={bookId} />
                    </View>

                    {/* Borrow Records Section */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeaderRow}>
                            <Ionicons name="people-outline" size={20} color={Colors.primary} />
                            <Text style={styles.sectionLabel}>Borrow Records</Text>
                            {bookRentals && (
                                <Text style={styles.recordCount}>{bookRentals.length}</Text>
                            )}
                        </View>

                        {bookRentals === undefined ? (
                            <View style={styles.recordsLoading}>
                                <BookLoader label="Loading records..." />
                            </View>
                        ) : bookRentals.length === 0 ? (
                            <View style={styles.emptyRecords}>
                                <Ionicons name="document-text-outline" size={36} color={Colors.textLight} />
                                <Text style={styles.emptyRecordsText}>No borrow records yet</Text>
                            </View>
                        ) : (
                            <View style={styles.recordsList}>
                                {bookRentals.map((rental) => {
                                    const statusLabel = RENTAL_STATUS_LABELS[rental.status] ?? rental.status;
                                    const statusColor = STATUS_COLORS[rental.status] ?? Colors.textSecondary;

                                    return (
                                        <View key={rental._id} style={styles.recordRow}>
                                            <View style={styles.recordInfo}>
                                                <Text style={styles.recordName} numberOfLines={1}>{rental.userName}</Text>
                                                <Text style={styles.recordDate}>
                                                    {rental.deliveryDate
                                                        ? `Borrowed: ${rental.deliveryDate}`
                                                        : `Requested: ${new Date(rental.createdAt).toLocaleDateString()}`}
                                                </Text>
                                                {rental.pickupDate && (
                                                    <Text style={styles.recordDate}>Return: {rental.pickupDate}</Text>
                                                )}
                                            </View>
                                            <View style={[styles.recordStatusBadge, { backgroundColor: statusColor + "18" }]}>
                                                <Text style={[styles.recordStatusText, { color: statusColor }]}>
                                                    {statusLabel}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    {/* Admin Actions */}
                    <View style={styles.actionsSection}>
                        <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() => router.push(`/(admin)/edit-book?bookId=${bookId}`)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="create-outline" size={20} color={Colors.primary} />
                            <Text style={styles.editBtnText}>Edit Book</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={handleDeletePress}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="trash-outline" size={20} color={Colors.error} />
                            <Text style={styles.deleteBtnText}>Delete Book</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>

            {/* Delete Confirmation — reuses existing ConfirmActionModal */}
            <ConfirmActionModal
                visible={deleteTarget !== null}
                title="Delete Book"
                message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                icon="trash-outline"
                tone="danger"
                loading={deleting}
                onConfirm={handleConfirmDelete}
                onCancel={cancelDelete}
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
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.xl,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: Spacing.md,
        gap: 12,
    },
    backBtn: {
        padding: 4,
        marginLeft: -4,
    },
    headerTitle: {
        flex: 1,
        fontSize: FontSizes.title,
        color: Colors.text,
        textAlign: "center",
        fontFamily: Fonts.bold,
    },
    headerSpacer: {
        width: 28,
    },
    scrollContent: {
        paddingBottom: Spacing.xl + 40,
    },
    infoSection: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        borderTopLeftRadius: Layout.cardRadiusLarge + 10,
        borderTopRightRadius: Layout.cardRadiusLarge + 10,
        backgroundColor: Colors.background,
        marginTop: -Spacing.lg,
    },
    bookTitle: {
        fontSize: FontSizes.heading,
        color: Colors.text,
        fontFamily: Fonts.bold,
        lineHeight: 34,
        marginBottom: 4,
    },
    bookAuthor: {
        fontSize: FontSizes.title,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        marginBottom: Spacing.md,
    },
    badgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    genreBadge: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    genreBadgeText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.primary,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    statusBadgeText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: Spacing.lg,
    },
    priceText: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },

    // Section Cards
    sectionCard: {
        backgroundColor: Colors.white,
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    sectionHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: Spacing.md,
    },
    sectionLabel: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        flex: 1,
    },
    descriptionText: {
        fontSize: FontSizes.bodyLarge,
        color: Colors.textSecondary,
        lineHeight: 24,
        letterSpacing: 0.2,
        fontFamily: Fonts.regular,
    },
    toggleText: {
        fontSize: FontSizes.body,
        color: Colors.primary,
        fontFamily: Fonts.medium,
        marginTop: Spacing.xs,
    },

    // Inventory
    inventoryGrid: {
        flexDirection: "row",
        backgroundColor: Colors.background,
        borderRadius: Layout.cardRadius,
        paddingVertical: Spacing.md,
        alignItems: "center",
        marginBottom: Spacing.md,
    },
    inventoryItem: {
        flex: 1,
        alignItems: "center",
        gap: 4,
    },
    inventoryNumber: {
        fontSize: FontSizes.heading,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    inventoryLabel: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    inventoryDivider: {
        width: 1,
        height: 30,
        backgroundColor: Colors.border,
        opacity: 0.6,
    },
    inventoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    inventoryBadgeText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
    },
    inventoryUpdateRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    inventoryInput: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    inventoryUpdateBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    inventoryUpdateBtnText: {
        color: Colors.white,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.small,
    },

    // Borrow Records
    recordCount: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
        backgroundColor: Colors.background,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
        overflow: "hidden",
    },
    recordsLoading: {
        paddingVertical: Spacing.xl,
        alignItems: "center",
    },
    emptyRecords: {
        alignItems: "center",
        paddingVertical: Spacing.xl,
        gap: Spacing.sm,
    },
    emptyRecordsText: {
        fontSize: FontSizes.body,
        color: Colors.textLight,
        fontFamily: Fonts.regular,
    },
    recordsList: {
        gap: Spacing.sm,
    },
    recordRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 14,
    },
    recordInfo: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    recordName: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 2,
    },
    recordDate: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 1,
    },
    recordStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    recordStatusText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
        textTransform: "uppercase",
    },

    // Admin Actions
    actionsSection: {
        flexDirection: "row",
        gap: Spacing.md,
        marginTop: Spacing.sm,
    },
    editBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        backgroundColor: Colors.white,
    },
    editBtnText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    deleteBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.error,
        backgroundColor: Colors.error + "08",
    },
    deleteBtnText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.error,
    },

    // Empty/Not found
    emptyTitle: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        textAlign: "center",
    },
});
