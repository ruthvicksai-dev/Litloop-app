import SearchInput from "@/components/shared/SearchInput";
import DiscoverBookCard from "@/components/ui/cards/DiscoverBookCard";
import ReviewCard from "@/components/ui/cards/ReviewCard";
import BookLoader from "@/components/ui/feedback/BookLoader";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import AdminHeader from "@/components/admin/AdminHeader";
import { useAdminBooksScreen, useFadeSlideIn } from "@/hooks";
import { useRouter } from "expo-router";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import {
    Alert,
    Animated,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

export default function AdminBooksScreen() {
    const router = useRouter();
    const { accessToken } = useAuth();
    const [refreshing, setRefreshing] = React.useState(false);
    const { books, search, setSearch, genreSections } = useAdminBooksScreen();
    const { fadeAnim, slideAnim } = useFadeSlideIn({ slideFrom: 20, duration: 400 });

    const problemBooks = useQuery(api.books.getProblemBooks, { accessToken: accessToken ?? "" });
    const flaggedReviews = useQuery(api.reviews.getAllFlaggedReviews, { accessToken: accessToken ?? "" });

    const flagReview = useMutation(api.reviews.flagReview);
    const unflagReview = useMutation(api.reviews.unflagReview);
    const deleteReviewMutation = useMutation(api.reviews.deleteReview);

    const handleFlagAction = async (reviewId: string, isCurrentlyFlagged: boolean) => {
        if (!accessToken) return;
        try {
            if (isCurrentlyFlagged) {
                await unflagReview({ reviewId: reviewId as any, accessToken });
            } else {
                await flagReview({ reviewId: reviewId as any, accessToken });
            }
        } catch (error: any) {
            Alert.alert("Error", error.message ?? "Action failed");
        }
    };

    const handleDeleteReview = async (reviewId: string) => {
        if (!accessToken) return;
        Alert.alert(
            "Delete Review",
            "Are you sure you want to delete this review?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteReviewMutation({ reviewId: reviewId as any, accessToken });
                        } catch (error: any) {
                            Alert.alert("Error", error.message ?? "Delete failed");
                        }
                    }
                }
            ]
        );
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    if (books === undefined) {
        return (
            <View style={styles.center}>
                <BookLoader label="Loading books..." />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View
                style={[
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
            >
                <AdminHeader 
                    title="Manage Books" 
                    rightComponent={
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => router.push("/(admin)/add-book")}
                        >
                            <Ionicons name="add" size={20} color={Colors.white} />
                            <Text style={styles.addBtnText}>Add</Text>
                        </TouchableOpacity>
                    }
                />
            </Animated.View>

            <Animated.View style={[styles.searchBox, { opacity: fadeAnim }]}>
                <SearchInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search by title or author..."
                    icon="search"
                    containerStyle={styles.searchInputContainer}
                    inputStyle={styles.searchInput}
                />
            </Animated.View>

            <FlatList
                data={genreSections}
                keyExtractor={(item) => item.genre}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <View style={styles.adminExtraSection}>
                        {(problemBooks && problemBooks.length > 0) && (
                            <View style={styles.dashboardSection}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="warning-outline" size={20} color={Colors.error} />
                                    <Text style={[styles.sectionTitle, { color: Colors.error, marginBottom: 0 }]}>Attention Needed</Text>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                                    {problemBooks.map((book) => (
                                        <TouchableOpacity 
                                            key={book._id} 
                                            style={styles.problemBookCard}
                                            onPress={() => router.push(`/(admin)/book-details?bookId=${book._id}` as any)}
                                        >
                                            <Text style={styles.problemBookTitle} numberOfLines={1}>{book.title}</Text>
                                            <View style={styles.problemBadgeRow}>
                                                {(book.avgRating ?? 0) < 3 && (
                                                    <View style={[styles.badge, { backgroundColor: Colors.error + "20" }]}>
                                                        <Text style={[styles.badgeText, { color: Colors.error }]}>Low Rating: {(book.avgRating ?? book.rating ?? 0).toFixed(1)}</Text>
                                                    </View>
                                                )}
                                                {(book.flaggedCount ?? 0) > 0 && (
                                                    <View style={[styles.badge, { backgroundColor: Colors.warning + "20" }]}>
                                                        <Text style={[styles.badgeText, { color: Colors.warning }]}>{book.flaggedCount} Flagged</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {(flaggedReviews && flaggedReviews.length > 0) && (
                            <View style={styles.dashboardSection}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="flag-outline" size={20} color={Colors.warning} />
                                    <Text style={[styles.sectionTitle, { color: Colors.warning, marginBottom: 0 }]}>Flagged Reviews</Text>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                                    {flaggedReviews.map((review) => (
                                        <ReviewCard
                                            key={review._id}
                                            review={{
                                                ...review,
                                                _id: review._id,
                                                userId: review.userId,
                                            }}
                                            isAdmin={true}
                                            style={styles.dashboardReviewCard}
                                            onFlag={() => handleFlagAction(review._id, false)}
                                            onUnflag={() => handleFlagAction(review._id, true)}
                                            onDelete={() => handleDeleteReview(review._id)}
                                        />
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.primary]}
                    />
                }
                renderItem={({ item, index }) => (
                    <Animated.View
                        style={[
                            styles.section,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    {
                                        translateY: fadeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [20 + index * 5, 0],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <Text style={styles.sectionTitle}>{item.genre}</Text>
                        <FlatList
                            data={item.books}
                            horizontal
                            keyExtractor={(book) => book._id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.genreRow}
                            renderItem={({ item: book }) => (
                                <DiscoverBookCard
                                    _id={book._id}
                                    title={book.title}
                                    author={book.author}
                                    rentPerDay={book.rentPerDay}
                                    availableCopies={book.availableCopies}
                                    coverUrl={book.coverUrl}
                                    coverUrls={book.coverUrls}
                                    hideFavorite
                                    onPress={() => router.push(`/(admin)/book-details?bookId=${book._id}` as any)}
                                />
                            )}
                        />
                    </Animated.View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons
                            name="book-outline"
                            size={60}
                            color={Colors.textLight}
                            style={{ marginBottom: Spacing.md }}
                        />
                        <Text style={styles.emptyText}>No books found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
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
    title: {
        flex: 1,
        fontSize: FontSizes.title,
        color: Colors.text,
        textAlign: 'center',
        fontFamily: Fonts.bold,
    },
    addBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    addBtnText: { color: Colors.white, fontFamily: Fonts.bold, fontSize: FontSizes.small },
    searchBox: {
        marginHorizontal: 25,
        marginBottom: Spacing.lg,
    },
    searchInputContainer: {
        borderWidth: 1.5,
        height: 44,
    },
    searchInput: {
        paddingVertical: 0,
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
    },
    list: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    section: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        paddingHorizontal: 25,
        marginBottom: Spacing.sm,
        fontSize: FontSizes.titleLarge,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    genreRow: {
        paddingLeft: 20,
        paddingRight: 10,
        paddingBottom: 8,
        alignItems: "flex-start",
    },
    empty: {
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 72,
    },
    emptyText: {
        fontSize: FontSizes.subtitle,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
    adminExtraSection: {
        paddingTop: Spacing.sm,
    },
    dashboardSection: {
        marginBottom: Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 25,
        gap: 8,
        marginBottom: Spacing.sm,
    },
    horizontalScroll: {
        paddingLeft: 25,
        paddingRight: 10,
        gap: 12,
    },
    problemBookCard: {
        backgroundColor: Colors.white,
        padding: 12,
        borderRadius: 12,
        width: 200,
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    problemBookTitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 8,
    },
    problemBadgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
    },
    dashboardReviewCard: {
        width: 280,
        marginRight: 12,
    },
});
