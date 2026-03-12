import Button from "@/components/ui/Button";
import { Colors, Spacing } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    Image,
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
    const book = useQuery(api.books.get, {
        bookId: id as Id<"books">,
    });
    const router = useRouter();

    // Entrance animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const coverScale = useRef(new Animated.Value(0.8)).current;
    const [activeIndex, setActiveIndex] = React.useState(0);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(coverScale, {
                toValue: 1,
                friction: 5,
                tension: 60,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

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
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>

                <Animated.View
                    style={[
                        styles.galleryWrapper,
                        { transform: [{ scale: coverScale }] },
                    ]}
                >
                    {((book.coverUrls && book.coverUrls.length > 0) || book.coverUrl) ? (
                        <View>
                            <FlatList
                                data={book.coverUrls && book.coverUrls.length > 0 ? book.coverUrls : [book.coverUrl!]}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(_, index) => index.toString()}
                                onScroll={(e) => {
                                    const x = e.nativeEvent.contentOffset.x;
                                    setActiveIndex(Math.round(x / SCREEN_WIDTH));
                                }}
                                scrollEventThrottle={16}
                                renderItem={({ item }) => (
                                    <View style={styles.galleryItem}>
                                        <Image
                                            source={{ uri: item }}
                                            style={styles.cover}
                                        />
                                    </View>
                                )}
                            />
                            {/* Pagination Dots */}
                            {(book.coverUrls && book.coverUrls.length > 1) && (
                                <View style={styles.pagination}>
                                    {book.coverUrls.map((_, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.dot,
                                                activeIndex === i && styles.activeDot,
                                            ]}
                                        />
                                    ))}
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={[styles.cover, styles.placeholder]}>
                            <Text style={styles.placeholderText}>📖</Text>
                        </View>
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
                    <Text style={styles.title}>{book.title}</Text>
                    <Text style={styles.author}>by {book.author}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>
                                ₹{book.rentPerDay}
                            </Text>
                            <Text style={styles.statLabel}>per day</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>
                                {book.availableCopies}
                            </Text>
                            <Text style={styles.statLabel}>available</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>
                                {book.totalCopies}
                            </Text>
                            <Text style={styles.statLabel}>total</Text>
                        </View>
                    </View>

                    <Text style={styles.descTitle}>Description</Text>
                    <Text style={styles.description}>{book.description}</Text>

                    <Button
                        title={
                            book.availableCopies > 0
                                ? "Request Book"
                                : "Unavailable"
                        }
                        onPress={() =>
                            router.push(`/rental/request?bookId=${book._id}`)
                        }
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
    galleryItem: {
        width: SCREEN_WIDTH,
        alignItems: "center",
        justifyContent: "center",
    },
    cover: {
        width: SCREEN_WIDTH * 0.6,
        height: SCREEN_WIDTH * 0.6 * 1.5,
        borderRadius: 16,
        backgroundColor: Colors.primaryLight,
    },
    pagination: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: Spacing.md,
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.border,
    },
    activeDot: {
        width: 14,
        backgroundColor: Colors.primary,
    },
    placeholder: {
        alignItems: "center",
        justifyContent: "center",
        width: SCREEN_WIDTH * 0.6,
        height: SCREEN_WIDTH * 0.6 * 1.5,
        borderRadius: 16,
    },
    placeholderText: {
        fontSize: SCREEN_WIDTH * 0.2,
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
