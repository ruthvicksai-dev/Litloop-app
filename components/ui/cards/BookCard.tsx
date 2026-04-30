import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import {
    Animated,
    Image,
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

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
    top10Position?: number;
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
    top10Position,
}: BookCardProps) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Animated.View style={[styles.card, style, { transform: [{ scale }] }]}>
            <TouchableOpacity
                style={styles.touchable}
                activeOpacity={0.9}
                onPress={onViewDetails}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                <View style={styles.row}>
                    {(coverUrls && coverUrls.length > 0) || coverUrl ? (
                        <Image
                            source={{ uri: (coverUrls && coverUrls.length > 0) ? coverUrls[0] : coverUrl! }}
                            style={styles.cover}
                        />
                    ) : (
                        <View style={[styles.cover, styles.placeholder]}>
                            <Ionicons name="book-outline" size={32} color={Colors.primary} />
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
                    <TouchableOpacity style={styles.detailsBtn} onPress={onViewDetails}>
                        <Text style={styles.detailsBtnText}>{viewDetailsLabel}</Text>
                    </TouchableOpacity>
                    {showRequestButton ? (
                        <TouchableOpacity
                            style={[
                                styles.requestBtn,
                                availableCopies === 0 && styles.disabledBtn,
                            ]}
                            onPress={onRequestBook}
                            disabled={availableCopies === 0}
                        >
                            <Text style={styles.requestBtnText}>{requestLabel}</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        height: "100%",
        borderWidth: 1,
        borderColor: Colors.border + "40",
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
        borderRadius: 8,
        backgroundColor: Colors.primaryLight,
        position: "relative",
    },
    top10Badge: {
        position: "absolute",
        top: 6,
        left: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
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
    placeholderText: {
        fontSize: FontSizes.display,
        fontFamily: Fonts.regular,
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
        marginBottom: 2,
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
        marginTop: Spacing.sm,
        gap: Spacing.sm,
        flexWrap: "wrap",
    },
    detailsBtn: {
        flex: 1,
        minWidth: 120,
        paddingVertical: 10,
        borderRadius: 8,
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
        borderRadius: 8,
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
});
