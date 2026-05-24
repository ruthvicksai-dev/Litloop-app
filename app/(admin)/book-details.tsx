import BookReviews from "@/components/books/BookReviews";
import BookLoader from "@/components/ui/feedback/BookLoader";
import ConfirmActionModal from "@/components/ui/feedback/ConfirmActionModal";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { useAdminBookDetailsScreen } from "@/hooks";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AdminHeader from "@/components/admin/core/AdminHeader";
import AdminBookHero from "@/components/admin/book-details/AdminBookHero";
import AdminBookDescription from "@/components/admin/book-details/AdminBookDescription";
import AdminBookInventory from "@/components/admin/book-details/AdminBookInventory";
import AdminBookBorrowRecords from "@/components/admin/book-details/AdminBookBorrowRecords";
import AdminBookActions from "@/components/admin/book-details/AdminBookActions";
import React from "react";
import { Alert, Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function AdminBookDetailsScreen() {
    const { bookId } = useLocalSearchParams<{ bookId: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
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
        loadMoreReviews,
        loadMoreRentals,
        reviewsLimit,
        rentalsLimit,
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
                <AdminHeader title="Book Details" />
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
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
            >
                <AdminHeader title="Book Details" />
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(80, 40 + insets.bottom) }]}
            >
                {/* Hero Section */}
                {/* Hero Section */}
                <Animated.View
                    style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
                >
                    <AdminBookHero book={book} images={images} genre={genre} />
                </Animated.View>

                {/* Main Content Sections */}
                <Animated.View
                    style={[
                        styles.contentSections,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    {/* Description */}
                    <AdminBookDescription
                        description={book.description}
                        isExpanded={isDescriptionExpanded}
                        onToggleExpand={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    />

                    {/* Inventory Section */}
                    <AdminBookInventory
                        inventoryStatus={inventoryStatus}
                        totalCopies={book.totalCopies}
                        availableCopies={book.availableCopies}
                        borrowedCopies={borrowedCopies}
                        inventoryValue={inventoryValue}
                        setInventoryValue={setInventoryValue}
                        updatingInventory={updatingInventory}
                        onSave={handleInventorySave}
                    />

                    {/* Reviews Section — reuses the existing BookReviews component */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeaderRow}>
                            <Ionicons name="chatbubbles-outline" size={20} color={Colors.primary} />
                            <Text style={styles.sectionLabel}>Reviews</Text>
                        </View>
                        <BookReviews
                            bookId={bookId}
                            limit={reviewsLimit}
                            hasMore={(reviewSummary?.totalReviews ?? 0) > (reviews?.length ?? 0)}
                            onLoadMore={loadMoreReviews}
                            isAdmin={true}
                        />
                    </View>

                    {/* Borrow Records Section */}
                    <AdminBookBorrowRecords
                        bookRentals={bookRentals}
                        rentalsLimit={rentalsLimit}
                        onLoadMore={loadMoreRentals}
                    />

                    {/* Admin Actions */}
                    <AdminBookActions
                        onEditPress={() => router.push(`/(admin)/edit-book?bookId=${bookId}`)}
                        onDeletePress={handleDeletePress}
                    />
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
    },
    contentSections: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        borderTopLeftRadius: Layout.cardRadiusLarge + 10,
        borderTopRightRadius: Layout.cardRadiusLarge + 10,
        backgroundColor: Colors.background,
    },
    heroSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.xs,
        gap: Spacing.md,
    },
    sectionCard: {
        paddingTop: Spacing.xs,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.xs,
        marginBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    sectionHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: Spacing.md,
    },
    sectionLabel: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        flex: 1,
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
