import BookImageCarousel from "@/components/books/BookImageCarousel";
import Button from "@/components/ui/Button";
import { Colors, Spacing } from "@/constants/theme";
import { useBookDetailsScreen } from "@/hooks/useBookDetailsScreen";
import { useFadeSlideScaleIn } from "@/hooks/useFadeSlideScaleIn";
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
    View,
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

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backText}>â† Back</Text>
                </TouchableOpacity>

                <Animated.View
                    style={[
                        styles.galleryWrapper,
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

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>â‚¹{book.rentPerDay}</Text>
                            <Text style={styles.statLabel}>per day</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{book.availableCopies}</Text>
                            <Text style={styles.statLabel}>available</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.stat}>
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
    backBtn: {
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingTop: Spacing.md,
    },
    backText: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: "600",
    },
    galleryWrapper: {
        width: SCREEN_WIDTH,
        alignItems: "center",
        paddingVertical: Spacing.lg,
    },
    info: {
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingBottom: SCREEN_HEIGHT * 0.04,
    },
    title: {
        fontSize: SCREEN_WIDTH * 0.06,
        fontWeight: "800",
        color: Colors.text,
        marginBottom: 4,
    },
    author: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
    },
    statsRow: {
        flexDirection: "row",
        backgroundColor: Colors.white,
        borderRadius: 16,
        paddingVertical: Spacing.md,
        alignItems: "center",
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        marginBottom: Spacing.lg,
    },
    stat: {
        flex: 1,
        alignItems: "center",
    },
    statValue: {
        fontSize: SCREEN_WIDTH * 0.05,
        fontWeight: "700",
        color: Colors.primary,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    divider: {
        width: 1,
        height: 32,
        backgroundColor: Colors.border,
    },
    descTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    description: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 22,
    },
});
