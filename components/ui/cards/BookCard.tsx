import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Shadows, Borders } from "@/constants/designTokens";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from "react-native-reanimated";

const SPRING = { damping: 16, stiffness: 350, mass: 0.8 };

interface BookCardProps {
    title: string;
    author: string;
    rentPerDay: number;
    availableCopies: number;
    coverUrl: string | null;
    coverUrls?: string[];
    onViewDetails: () => void;
    onRequestBook: () => void;
    style?: StyleProp<ViewStyle>;
    viewDetailsLabel?: string;
    requestLabel?: string;
    showRequestButton?: boolean;
    isRequestDestructive?: boolean;
    top10Position?: number;
    onViewReviews?: () => void;
}

export default function BookCard({
    title,
    author,
    rentPerDay,
    availableCopies,
    coverUrl,
    coverUrls,
    onViewDetails,
    onRequestBook,
    style,
    viewDetailsLabel = "View Details",
    requestLabel = "Request Book",
    showRequestButton = true,
    isRequestDestructive = false,
    top10Position,
    onViewReviews,
}: BookCardProps) {
    const scaleAnim = useSharedValue(1);

    const animatedCardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scaleAnim.value }],
    }));

    const handlePressIn = () => {
        scaleAnim.value = withSpring(0.975, SPRING);
    };

    const handlePressOut = () => {
        scaleAnim.value = withSpring(1, SPRING);
    };

    return (
        <Animated.View style={[styles.card, style, animatedCardStyle]}>
            <Pressable
                style={styles.touchable}
                onPress={onViewDetails}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                <View style={styles.row}>
                    {(coverUrls && coverUrls.length > 0) || coverUrl ? (
                        <Image
                            source={(coverUrls && coverUrls.length > 0) ? coverUrls[0] : coverUrl!}
                            style={styles.cover}
                            cachePolicy="disk"
                            contentFit="cover"
                        />
                    ) : (
                        <View style={[styles.cover, styles.placeholder]}>
                            <Ionicons name="book-outline" size={28} color={Colors.primary} />
                        </View>
                    )}

                    {top10Position && (
                        <LinearGradient
                            colors={
                                top10Position === 1 ? ["#FFD700", "#FFA500"] :
                                    top10Position === 2 ? ["#E5E4E2", "#B4B4B4"] :
                                        top10Position === 3 ? ["#CD7F32", "#A0522D"] :
                                            [Colors.primary, "#8B4513"]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.top10Badge}
                        >
                            <Text style={styles.top10Text}>#{top10Position}</Text>
                        </LinearGradient>
                    )}
                    <View style={styles.info}>
                        <Text style={styles.title} numberOfLines={2}>
                            {title}
                        </Text>
                        <Text style={styles.author} numberOfLines={1}>
                            {author}
                        </Text>
                        <Text style={styles.rent}>₹{rentPerDay}/day</Text>
                        <Text
                            style={[
                                styles.availability,
                                availableCopies === 0 && styles.unavailable,
                            ]}
                        >
                            {availableCopies > 0
                                ? `${availableCopies} available`
                                : "Unavailable"}
                        </Text>
                    </View>
                </View>
                <View style={styles.actions}>
                    <Pressable style={styles.detailsBtn} onPress={onViewDetails}>
                        <Text style={styles.detailsBtnText}>{viewDetailsLabel}</Text>
                    </Pressable>
                    {showRequestButton ? (
                        <Pressable
                            style={[
                                styles.requestBtn,
                                isRequestDestructive && styles.destructiveBtn,
                                availableCopies === 0 && !isRequestDestructive && styles.disabledBtn,
                            ]}
                            onPress={onRequestBook}
                            disabled={availableCopies === 0 && !isRequestDestructive}
                        >
                            <Text style={styles.requestBtnText}>{requestLabel}</Text>
                        </Pressable>
                    ) : null}
                    {onViewReviews && (
                        <Pressable style={styles.reviewsBtn} onPress={onViewReviews}>
                            <Ionicons name="chatbubbles-outline" size={15} color={Colors.primary} />
                            <Text style={styles.reviewsBtnText}>Reviews</Text>
                        </Pressable>
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surfaceCard,
        borderRadius: 18,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        height: "100%",
        ...Borders.card,
        ...Shadows.subtle,
    },
    touchable: {
        flex: 1,
        justifyContent: "space-between",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    cover: {
        width: "25%",
        maxWidth: 96,
        minWidth: 72,
        aspectRatio: 2 / 3,
        borderRadius: 10,
        backgroundColor: Colors.primaryLight,
        position: "relative",
    },
    top10Badge: {
        position: "absolute",
        top: 6,
        left: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
    },
    top10Text: {
        color: Colors.white,
        fontSize: 10,
        fontFamily: Fonts.bold,
        letterSpacing: -0.2,
    },
    placeholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    info: {
        flex: 1,
        marginLeft: Spacing.md,
        justifyContent: "center",
        minWidth: 0,
        minHeight: 104,
    },
    title: {
        fontSize: FontSizes.bodyLarge,
        lineHeight: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 3,
    },
    author: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        marginBottom: 6,
        fontFamily: Fonts.regular,
    },
    rent: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.medium,
        color: Colors.primary,
        marginBottom: 4,
    },
    availability: {
        fontSize: FontSizes.caption,
        color: Colors.success,
        fontFamily: Fonts.medium,
    },
    unavailable: {
        color: Colors.error,
    },
    actions: {
        flexDirection: "row",
        marginTop: Spacing.sm + 2,
        gap: Spacing.sm,
        flexWrap: "wrap",
    },
    detailsBtn: {
        flex: 1,
        minWidth: 120,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.primary,
        alignItems: "center",
    },
    detailsBtnText: {
        color: Colors.primary,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.small,
    },
    requestBtn: {
        flex: 1,
        minWidth: 120,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: Colors.primary,
        alignItems: "center",
    },
    requestBtnText: {
        color: Colors.white,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.small,
    },
    disabledBtn: {
        opacity: 0.4,
    },
    destructiveBtn: {
        backgroundColor: Colors.error,
    },
    reviewsBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: `${Colors.primary}25`,
        minWidth: 100,
    },
    reviewsBtnText: {
        color: Colors.primary,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.small,
    },
});
