import BookImageCarousel from "@/components/books/BookImageCarousel";
import Button from "@/components/ui/Button";
import { Fonts } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useBookDetailsScreen } from "@/hooks/useBookDetailsScreen";
import { useFadeSlideScaleIn } from "@/hooks/useFadeSlideScaleIn";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function BookDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { fadeAnim, slideAnim, scaleAnim } = useFadeSlideScaleIn({
        slideFrom: 40,
        scaleFrom: 0.8,
    });
    const { book, activeIndex, setActiveIndex, images } = useBookDetailsScreen(id);

    if (book === undefined) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (book === null) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Book Details</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={[styles.center, { paddingHorizontal: 40 }]}>
                    <Ionicons name="book-outline" size={60} color={Colors.textLight} style={{ marginBottom: 20 }} />
                    <Text style={{ fontSize: 18, fontFamily: Fonts.bold, color: Colors.text, marginBottom: 8 }}>
                        Book not found
                    </Text>
                    <Text style={{ textAlign: "center", color: Colors.textSecondary, marginBottom: 24 }}>
                        The book you're looking for might have been removed or doesn't exist.
                    </Text>
                    <Button title="Go Back" onPress={() => router.back()} style={{ width: "100%" }} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 60 }}
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
                    />
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
                    <Text style={styles.title}>{book.title}</Text>
                    <Text style={styles.author}>by {book.author}</Text>

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Ionicons name="pricetag-outline" size={20} color={Colors.primary} />
                            <Text style={styles.statValue}>₹{book.rentPerDay}</Text>
                            <Text style={styles.statLabel}>per day</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.success} />
                            <Text style={styles.statValue}>{book.availableCopies}</Text>
                            <Text style={styles.statLabel}>available</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Ionicons name="library-outline" size={20} color={Colors.textSecondary} />
                            <Text style={styles.statValue}>{book.totalCopies}</Text>
                            <Text style={styles.statLabel}>total</Text>
                        </View>
                    </View>

                    <Text style={styles.descTitle}>Description</Text>
                    <Text style={styles.description}>{book.description}</Text>

                    <Button
                        title={book.availableCopies > 0 ? "Request Book" : "Unavailable"}
                        onPress={() => router.push(`/rental/request?bookId=${book._id}`)}
                        disabled={book.availableCopies <= 0}
                        style={{ marginTop: Spacing.lg }}
                    />
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
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingVertical: Spacing.md,
    },
    headerTitle: {
        fontSize: 18,  color: Colors.text, fontFamily: Fonts.bold,
    },
    backBtn: {
        padding: 8,
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 10,
    },
    carouselSection: {
        width: SCREEN_WIDTH,
        backgroundColor: Colors.white,
    },
    info: {
        paddingHorizontal: SCREEN_WIDTH * 0.07,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.xl,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        backgroundColor: Colors.background,
        marginTop: -20,
    },
    title: {
        fontSize: 28,
        color: Colors.text,
        lineHeight: 34,
        marginBottom: 6,
        fontFamily: Fonts.bold,
    },
    author: {
        fontSize: 18,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        marginBottom: Spacing.lg,
    },
    statsContainer: {
        flexDirection: "row",
        backgroundColor: Colors.white,
        borderRadius: 20,
        paddingVertical: Spacing.md,
        alignItems: "center",
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
        marginBottom: Spacing.xl,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
        gap: 4,
    },
    statValue: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    statLabel: {
        fontSize: 11,
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
        fontSize: 18,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    description: {
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 24,
        letterSpacing: 0.2,
        fontFamily: Fonts.regular,
    },
});
