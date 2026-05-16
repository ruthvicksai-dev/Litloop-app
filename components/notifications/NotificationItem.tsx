import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { timeAgo } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "../ui/core/AnimatedPressable";

type NotificationItemProps = {
    item: any;
    onPress: (item: any) => void;
    icon: keyof typeof Ionicons.glyphMap;
};

export function NotificationItem({ item, onPress, icon }: NotificationItemProps) {
    return (
        <AnimatedPressable
            style={[styles.item, !item.isRead && styles.itemUnread]}
            onPress={() => onPress(item)}
        >
            <View style={[styles.iconWrap, !item.isRead && styles.iconWrapUnread]}>
                <Ionicons
                    name={icon}
                    size={20}
                    color={item.isRead ? Colors.textSecondary : Colors.primary}
                />
            </View>
            <View style={styles.textWrap}>
                <View style={styles.titleRow}>
                    <Text style={[styles.itemTitle, !item.isRead && styles.itemTitleUnread]}
                        numberOfLines={1}>
                        {item.title}
                    </Text>
                    {!item.isRead && <View style={styles.dot} />}
                </View>
                <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
            </View>
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    item: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: 20,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.background,
        borderLeftWidth: 3,
        borderLeftColor: "transparent",
    },
    itemUnread: {
        backgroundColor: `${Colors.primary}06`,
        borderLeftColor: Colors.primary,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.border + "60",
        alignItems: "center",
        justifyContent: "center",
        marginRight: Spacing.md,
        marginTop: 2,
    },
    iconWrapUnread: {
        backgroundColor: Colors.primaryLight,
    },
    textWrap: {
        flex: 1,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
    },
    itemTitle: {
        flex: 1,
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
    },
    itemTitleUnread: {
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    itemBody: {
        marginTop: 2,
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        lineHeight: 18,
    },
    itemTime: {
        marginTop: 4,
        fontSize: FontSizes.small,
        color: Colors.textLight,
        fontFamily: Fonts.regular,
    },
});
