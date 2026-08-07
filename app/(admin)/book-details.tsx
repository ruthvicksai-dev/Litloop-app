import BookReviews from "@/components/books/BookReviews";
import BookLoader from "@/components/ui/feedback/BookLoader";
import ConfirmActionModal from "@/components/ui/feedback/ConfirmActionModal";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useAdminBookDetailsScreen } from "@/hooks";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AdminBookHero from "@/components/admin/book-details/AdminBookHero";
import AdminBookDescription from "@/components/admin/book-details/AdminBookDescription";
import AdminBookInventory from "@/components/admin/book-details/AdminBookInventory";
import AdminBookBorrowRecords from "@/components/admin/book-details/AdminBookBorrowRecords";
import AdminBookActions from "@/components/admin/book-details/AdminBookActions";
import KeyboardAwareScrollView from "@/components/ui/core/KeyboardAwareScrollView";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
            <SafeAreaView style={styles.center} edges={["bottom", "left", "right"]}>
                <BookLoader label="Loading book details..." />
            </SafeAreaView>
        );
    }

    // Not found state
    if (book === null) {
        return (
            <SafeAreaView style={styles.center} edges={["bottom", "left", "right"]}>
                <View style={styles.emptyIconCircle}>
                    <Ionicons name="book-outline" size={40} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Book not found</Text>
                <Text style={styles.emptySubtitle}>This book may have been removed.</Text>
                <TouchableOpacity
                    style={styles.goBackBtn}
                    activeOpacity={0.8}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={16} color={Colors.white} />
                    <Text style={styles.goBackBtnText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const genre = book.genre ?? book.genres?.[0] ?? "General";

    return (
        <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
            <StatusBar style="light" animated />

            {/* ─── Fixed Hero Header (OUTSIDE ScrollView so it stays fixed at top) ─── */}
            <AdminBookHero
                book={book}
                images={images}
                genre={genre}
                onBack={() => {
                    triggerHaptic("light");
                    router.back();
                }}
            />

            {/* ─── Scrollable Card Content Body ─── */}
            <KeyboardAwareScrollView
                style={styles.flex}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(80, 40 + insets.bottom) }]}
            >
                <Animated.View
                    style={[
                        styles.contentSections,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    {/* Description Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <Ionicons name="document-text" size={16} color={Colors.primary} />
                            <Text style={styles.cardHeaderTitle}>Description</Text>
                        </View>
                        <AdminBookDescription
                            description={book.description}
                            isExpanded={isDescriptionExpanded}
                            onToggleExpand={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        />
                    </View>

                    {/* Inventory Card */}
                    <View style={styles.card}>
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
                    </View>

                    {/* Reviews Card — only if reviews exist */}
                    {(reviewSummary?.totalReviews ?? 0) > 0 && (
                        <View style={styles.card}>
                            <View style={styles.cardHeaderRow}>
                                <Ionicons name="chatbubbles" size={16} color={Colors.primary} />
                                <Text style={styles.cardHeaderTitle}>Reviews</Text>
                                <View style={styles.countBadge}>
                                    <Text style={styles.countBadgeText}>{reviewSummary?.totalReviews}</Text>
                                </View>
                            </View>
                            <BookReviews
                                bookId={bookId}
                                limit={reviewsLimit}
                                hasMore={(reviewSummary?.totalReviews ?? 0) > (reviews?.length ?? 0)}
                                onLoadMore={loadMoreReviews}
                                isAdmin={true}
                                hideTitle={true}
                            />
                        </View>
                    )}

                    {/* Borrow Records Card */}
                    <View style={styles.card}>
                        <AdminBookBorrowRecords
                            bookRentals={bookRentals}
                            rentalsLimit={rentalsLimit}
                            onLoadMore={loadMoreRentals}
                        />
                    </View>

                    {/* Admin Actions Card */}
                    <View style={styles.card}>
                        <AdminBookActions
                            onEditPress={() => router.push(`/(admin)/edit-book?bookId=${bookId}`)}
                            onDeletePress={handleDeletePress}
                        />
                    </View>
                </Animated.View>
            </KeyboardAwareScrollView>

            {/* Delete Confirmation */}
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
    flex: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.xl,
    },
    scrollContent: {},
    contentSections: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    /* White Cards */
    card: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        marginBottom: 12,
        padding: 16,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
    },
    cardHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.04)",
    },
    cardHeaderTitle: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
        flex: 1,
        letterSpacing: 0.2,
    },
    countBadge: {
        backgroundColor: Colors.primary + "15",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    countBadgeText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    /* Empty / Not Found */
    emptyIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primary + "12",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
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
        marginBottom: 20,
    },
    goBackBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 14,
    },
    goBackBtnText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.white,
    },
});
