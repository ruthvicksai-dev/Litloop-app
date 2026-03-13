import { Fonts } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
Animated,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
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
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
            <TouchableOpacity
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
                        <Text style={styles.detailsBtnText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.requestBtn,
                            availableCopies === 0 && styles.disabledBtn,
                        ]}
                        onPress={onRequestBook}
                        disabled={availableCopies === 0}
                    >
                        <Text style={styles.requestBtnText}>Request Book</Text>
                    </TouchableOpacity>
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
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    row: {
        flexDirection: "row",
    },
    cover: {
        width: 80,
        height: 120,
        borderRadius: 8,
        backgroundColor: Colors.primaryLight,
    },
    placeholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    placeholderText: {
        fontSize: 32,
      fontFamily: Fonts.regular,
    },
    info: {
        flex: 1,
        marginLeft: Spacing.md,
        justifyContent: "center",
    },
    title: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 4,
    },
    author: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 8,
      fontFamily: Fonts.regular,
    },
    rent: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: Colors.primary,
        marginBottom: 4,
    },
    availability: {
        fontSize: 12,
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
    },
    detailsBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.primary,
        alignItems: "center",
    },
    detailsBtnText: {
        color: Colors.primary,
        fontFamily: Fonts.medium,
        fontSize: 13,
    },
    requestBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: Colors.primary,
        alignItems: "center",
    },
    requestBtnText: {
        color: Colors.white,
        fontFamily: Fonts.medium,
        fontSize: 13,
    },
    disabledBtn: {
        opacity: 0.4,
    },
});
