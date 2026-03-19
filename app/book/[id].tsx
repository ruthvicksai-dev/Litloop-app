import BookImageCarousel from "@/components/books/BookImageCarousel";
import BookLoader from "@/components/ui/BookLoader";
import Button from "@/components/ui/Button";
import DiscoverBookCard from "@/components/ui/DiscoverBookCard";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useBookDetailsScreen } from "@/hooks";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BookDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { userId } = useAuth();
    const { showToast } = useToast();
    const subscribeToBook = useMutation(api.notifications.subscribeToBook);
    const [isSubscribing, setIsSubscribing] = useState(false);

    const {
        book,
        relatedBooks,
        activeIndex,
        setActiveIndex,
        images,
        isDescriptionExpanded,
        setIsDescriptionExpanded,
        descriptionLineLimit,
        shouldShowDescriptionToggle,
        detailItems,
        relatedSubtitle,
        isFavorite,
        isReadLater,
        handleFavoritePress,
        handleReadLaterPress,
        fadeAnim,
        slideAnim,
        scaleAnim,
    } = useBookDetailsScreen(id);

    const handleNotifyMe = async () => {
        if (!userId) {
            showToast("Please sign in to get notified.", "error");
            return;
        }
        if (!book) return;
        setIsSubscribing(true);
        try {
            await subscribeToBook({ userId, bookId: book._id as Id<"books"> });
            showToast("You'll be notified when this book is available! 🔔", "success");
        } catch {
            showToast("Failed to subscribe. Please try again.", "error");
        } finally {
            setIsSubscribing(false);
        }
    };

    if (book === undefined) {
        return (
            <View style={styles.center}>
                <BookLoader label="Loading book..." />
            </View>
        );
    }

    if (book === null) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtnMissing}>
                        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Book Details</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={[styles.center, styles.missingState]}>
                    <Ionicons
                        name="book-outline"
                        size={60}
                        color={Colors.textLight}
                        style={styles.missingIcon}
                    />
                    <Text style={styles.missingTitle}>Book not found</Text>
                    <Text style={styles.missingText}>
                        The book you&apos;re looking for might have been removed or doesn&apos;t exist.
                    </Text>
                    <Button title="Go Back" onPress={() => router.back()} style={styles.fullWidthButton} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>

                <Animated.View
                    style={[
                        styles.carouselSection,
                        { transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    <BookImageCarousel
                        images={images}
                        activeIndex={activeIndex}
                        onIndexChange={setActiveIndex}
                        isUnavailable={book.availableCopies === 0}
                    />
                    {book.top10Position && (
                        <LinearGradient
                            colors={
                                book.top10Position === 1 ? ["#FFD700", "#FFA500"] :
                                    book.top10Position === 2 ? ["#E5E4E2", "#B4B4B4"] :
                                        book.top10Position === 3 ? ["#CD7F32", "#A0522D"] :
                                            [Colors.primary, "#8B4513"]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.detailsTop10Badge}
                        >
                            <Ionicons name="trophy" size={14} color={Colors.white} style={{ marginRight: 4 }} />
                            <Text style={styles.top10Text}>Top 10 Rental • #{book.top10Position}</Text>
                        </LinearGradient>
                    )}
                </Animated.View>

                <Animated.View
                    style={[
                        styles.info,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.titleRow}>
                        <View style={styles.titleContent}>
                            <Text style={styles.title}>{book.title}</Text>
                            <Text style={styles.author}>by {book.author}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={handleFavoritePress}
                            activeOpacity={0.85}
                        >
                            <Ionicons
                                name={isFavorite ? "heart" : "heart-outline"}
                                size={22}
                                color={isFavorite ? Colors.error : Colors.primary}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Ionicons name="pricetag-outline" size={20} color={Colors.primary} />
                            <Text style={styles.statValue}>₹ {book.rentPerDay}</Text>
                            <Text style={styles.statLabel}>per day</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={20}
                                color={book.availableCopies > 0 ? Colors.success : Colors.error}
                            />
                            <Text style={[styles.statValue, book.availableCopies === 0 && { color: Colors.error }]}>
                                {book.availableCopies}
                            </Text>
                            <Text style={styles.statLabel}>
                                {book.availableCopies > 0 ? "available" : "out of stock"}
                            </Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Ionicons name="library-outline" size={20} color={Colors.textSecondary} />
                            <Text style={styles.statValue}>{book.totalCopies}</Text>
                            <Text style={styles.statLabel}>total</Text>
                        </View>
                    </View>

                    <Text style={styles.descTitle}>Description</Text>
                    <Text
                        style={styles.description}
                        numberOfLines={isDescriptionExpanded ? undefined : descriptionLineLimit}
                    >
                        {book.description}
                    </Text>
                    {shouldShowDescriptionToggle ? (
                        <TouchableOpacity
                            style={styles.descriptionToggle}
                            onPress={() => setIsDescriptionExpanded((current) => !current)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.descriptionToggleText}>
                                {isDescriptionExpanded ? "View less" : "View more"}
                            </Text>
                        </TouchableOpacity>
                    ) : null}

                    <View style={styles.detailsSection}>
                        <Text style={styles.descTitle}>Details</Text>
                        <View style={styles.detailsList}>
                            {detailItems.map((item) => (
                                <Text key={item.label} style={styles.detailText}>
                                    <Text style={styles.detailLabel}>{item.label}: </Text>
                                    <Text style={styles.detailValue}>{item.value}</Text>
                                </Text>
                            ))}
                        </View>
                    </View>

                    <View style={styles.ctaRow}>
                        {book.availableCopies > 0 ? (
                            <Button
                                title="Rent Now"
                                onPress={() => router.push(`/rental/request?bookId=${book._id}`)}
                                style={styles.primaryCta}
                            />
                        ) : (
                            <TouchableOpacity
                                style={[styles.notifyMeBtn, isSubscribing && styles.notifyMeBtnDisabled]}
                                onPress={handleNotifyMe}
                                disabled={isSubscribing}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="notifications-outline" size={18} color={Colors.white} style={{ marginRight: 6 }} />
                                <Text style={styles.notifyMeBtnText}>
                                    {isSubscribing ? "Subscribing..." : "Notify Me When Available"}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.addButton,
                                isReadLater && styles.addButtonActive,
                            ]}
                            onPress={handleReadLaterPress}
                            activeOpacity={0.85}
                        >
                            <Ionicons
                                name={isReadLater ? "bookmark" : "bookmark-outline"}
                                size={22}
                                color={isReadLater ? Colors.white : Colors.primary}
                            />
                        </TouchableOpacity>
                    </View>

                    {relatedBooks && relatedBooks.length > 0 ? (
                        <View style={styles.relatedSection}>
                            <Text style={styles.relatedTitle}>You may also like</Text>
                            <Text style={styles.relatedSubtitle}>{relatedSubtitle}</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.relatedList}
                            >
                                {relatedBooks.map((item) => (
                                    <DiscoverBookCard
                                        key={item._id}
                                        _id={item._id}
                                        title={item.title}
                                        author={item.author}
                                        rentPerDay={item.rentPerDay}
                                        availableCopies={item.availableCopies}
                                        coverUrl={item.coverUrl}
                                        coverUrls={item.coverUrls}
                                        genre={item.genre ?? item.genres?.[0]}
                                        bookViews={item.bookViews}
                                        top10Position={item.top10Position}
                                    />
                                ))}
                            </ScrollView>
                        </View>
                    ) : null}
                </Animated.View>
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
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: Layout.screenPaddingWide,
        paddingVertical: Spacing.md,
    },
    headerTitle: {
        fontSize: FontSizes.title,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    headerSpacer: {
        width: 40,
    },
    backBtn: {
        padding: Spacing.sm,
        position: "absolute",
        top: Spacing.sm,
        left: Spacing.sm,
        zIndex: 10,
    },
    backBtnMissing: {
        padding: 8,
    },
    carouselSection: {
        width: "100%",
        backgroundColor: Colors.white,
    },
    info: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.xl,
        borderTopLeftRadius: Layout.cardRadiusLarge + 10,
        borderTopRightRadius: Layout.cardRadiusLarge + 10,
        backgroundColor: Colors.background,
        marginTop: -Spacing.lg,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    titleContent: {
        flex: 1,
    },
    title: {
        fontSize: FontSizes.heading,
        color: Colors.text,
        lineHeight: 34,
        marginBottom: 6,
        fontFamily: Fonts.bold,
    },
    author: {
        fontSize: FontSizes.title,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
    },
    iconButton: {
        width: Layout.touchSize,
        height: Layout.touchSize,
        borderRadius: Layout.touchSize / 2,
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(117,64,67,0.12)",
    },
    statsContainer: {
        flexDirection: "row",
        backgroundColor: Colors.white,
        borderRadius: Layout.cardRadiusLarge,
        paddingVertical: Spacing.md,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
        marginBottom: Spacing.xl,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
        gap: 4,
    },
    statValue: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        textAlign: "center",
    },
    statLabel: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        fontFamily: Fonts.regular,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: Colors.border,
        opacity: 0.6,
    },
    descTitle: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    description: {
        fontSize: FontSizes.bodyLarge,
        color: Colors.textSecondary,
        lineHeight: 24,
        letterSpacing: 0.2,
        fontFamily: Fonts.regular,
    },
    descriptionToggle: {
        alignSelf: "flex-start",
        marginTop: Spacing.xs,
    },
    descriptionToggleText: {
        fontSize: FontSizes.body,
        color: Colors.primary,
        fontFamily: Fonts.medium,
    },
    detailsSection: {
        marginTop: Spacing.lg,
    },
    detailsList: {
        gap: 6,
    },
    detailLabel: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
    },
    detailText: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        lineHeight: 22,
    },
    detailValue: {
        fontSize: FontSizes.body,
        color: Colors.text,
        fontFamily: Fonts.medium,
    },
    ctaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        marginTop: Spacing.lg,
    },
    primaryCta: {
        flex: 1,
    },
    notifyMeBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 13,
        borderRadius: 10,
        backgroundColor: "#E65100",
    },
    notifyMeBtnDisabled: {
        opacity: 0.6,
    },
    notifyMeBtnText: {
        color: Colors.white,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.small,
    },
    addButton: {
        width: Layout.touchSize + 8,
        height: Layout.touchSize + 8,
        borderRadius: Layout.borderRadius + 4,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
    },
    addButtonActive: {
        backgroundColor: Colors.primary,
    },
    relatedSection: {
        marginTop: 34,
    },
    relatedTitle: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    relatedSubtitle: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        marginTop: 2,
        marginBottom: Spacing.md,
    },
    relatedList: {
        paddingRight: 10,
    },
    scrollContent: {
        paddingBottom: Layout.tabBarHeight,
    },
    missingState: {
        paddingHorizontal: 40,
    },
    missingIcon: {
        marginBottom: 20,
    },
    missingTitle: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 8,
    },
    missingText: {
        textAlign: "center",
        color: Colors.textSecondary,
        marginBottom: 24,
        fontFamily: Fonts.regular,
    },
    fullWidthButton: {
        width: "100%",
    },
    detailsTop10Badge: {
        position: "absolute",
        top: Layout.screenPaddingWide,
        right: Layout.screenPaddingWide,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: Spacing.sm + 4,
        paddingVertical: Spacing.xs + 2,
        borderRadius: Layout.borderRadius + 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.4)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    top10Text: {
        color: Colors.white,
        fontSize: 12,
        fontFamily: Fonts.bold,
        letterSpacing: -0.2,
    },
});
