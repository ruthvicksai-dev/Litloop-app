import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors } from "@/constants/theme";

interface AdminBookDescriptionProps {
    description: string;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

export default function AdminBookDescription({
    description,
    isExpanded,
    onToggleExpand,
}: AdminBookDescriptionProps) {
    return (
        <View>
            <Text
                style={styles.descriptionText}
                numberOfLines={isExpanded ? undefined : 3}
            >
                {description}
            </Text>
            {description.length > 140 && (
                <TouchableOpacity
                    onPress={onToggleExpand}
                    activeOpacity={0.8}
                    style={styles.toggleBtn}
                >
                    <Text style={styles.toggleText}>
                        {isExpanded ? "Show less" : "Read more"}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    descriptionText: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        lineHeight: 22,
        letterSpacing: 0.15,
        fontFamily: Fonts.regular,
    },
    toggleBtn: {
        marginTop: 6,
        alignSelf: "flex-start",
    },
    toggleText: {
        fontSize: FontSizes.caption,
        color: Colors.primary,
        fontFamily: Fonts.bold,
    },
});
