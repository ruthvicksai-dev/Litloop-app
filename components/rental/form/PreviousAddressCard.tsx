import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { triggerHaptic } from "@/utils";

export interface AddressTemplate {
    id: string;
    zone: string;
    phone: string;
    area?: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
    formattedAddress?: string;
    roomNo?: string;
    yearOfStudy?: string;
    department?: string;
    rollNo?: string;
    lastUsedAt: number;
    hasGpsCoords: boolean;
}

interface PreviousAddressCardProps {
    address: AddressTemplate;
    onSelect: (address: AddressTemplate) => Promise<void> | void;
    index: number;
    isVerifying?: boolean;
    disabled?: boolean;
}

function getTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

export default function PreviousAddressCard({
    address,
    onSelect,
    index,
    isVerifying = false,
    disabled = false,
}: PreviousAddressCardProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(12)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                delay: index * 80,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                delay: index * 80,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, index]);

    const isHome = address.zone === "Home";
    const icon = isHome ? "home" : "school";
    const zoneLabel = isHome ? "Home" : "College";

    const preview = isHome
        ? [address.area, address.landmark].filter(Boolean).join(" · ") || "No details"
        : [address.department, `Room ${address.roomNo}`].filter(Boolean).join(" · ") || "No details";


    return (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            }}
        >
            <TouchableOpacity
                style={[styles.card, disabled && !isVerifying && { opacity: 0.5 }]}
                activeOpacity={0.7}
                disabled={isVerifying || disabled}
                onPress={() => {
                    triggerHaptic("light");
                    onSelect(address);
                }}
            >
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={icon}
                        size={18}
                        color={Colors.primary}
                    />
                </View>

                <View style={styles.content}>
                    <View style={styles.topRow}>
                        <Text style={styles.zoneLabel} numberOfLines={1}>
                            {zoneLabel}
                        </Text>
                    </View>
                    <Text style={styles.preview} numberOfLines={1}>
                        {preview}
                    </Text>
                    <Text style={styles.timeAgo}>
                        {getTimeAgo(address.lastUsedAt)}
                    </Text>
                </View>

                <View style={[styles.useBtn, isVerifying && styles.useBtnDisabled]}>
                    {isVerifying ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                        <Text style={styles.useBtnText}>Use</Text>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.surfaceCard,
        borderRadius: 14,
        padding: Spacing.sm + 2,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.primary + "10",
        justifyContent: "center",
        alignItems: "center",
        marginRight: Spacing.sm,
    },
    content: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 2,
    },
    zoneLabel: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    preview: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
    },
    timeAgo: {
        fontSize: 10,
        fontFamily: Fonts.regular,
        color: Colors.textLight,
        marginTop: 1,
    },
    useBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
        minWidth: 50,
        alignItems: "center",
    },
    useBtnDisabled: {
        opacity: 0.7,
    },
    useBtnText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
        color: Colors.white,
    },
});
