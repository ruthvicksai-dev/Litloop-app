import { Shadows } from "@/constants/designTokens";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing, scale } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleProp, StyleSheet, TextInput, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";

type SearchInputProps = {
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    containerStyle?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    icon?: string;
    onPress?: () => void;
};

export default function SearchInput({
    value,
    onChangeText,
    placeholder,
    containerStyle,
    inputStyle,
    onPress,
}: SearchInputProps) {
    const content = (
        <View style={[styles.container, containerStyle]}>
            <Ionicons name="search-outline" size={scale(20)} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
                style={[styles.input, inputStyle]}
                placeholder={placeholder}
                placeholderTextColor={Colors.textLight}
                value={value}
                onChangeText={onChangeText}
                editable={!onPress}
                pointerEvents={onPress ? "none" : "auto"}
                autoCapitalize="none"
                autoCorrect={false}
            />
            {value.length > 0 && !onPress && (
                <TouchableOpacity
                    onPress={() => onChangeText("")}
                    hitSlop={{ top: scale(10), bottom: scale(10), left: scale(10), right: scale(10) }}
                    style={styles.clearBtn}
                >
                    <Ionicons name="close-circle" size={scale(18)} color={Colors.textLight} />
                </TouchableOpacity>
            )}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.white,
        borderRadius: scale(24),
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
        minHeight: scale(54),
        ...Shadows.card,
    },
    searchIcon: {
        marginLeft: scale(2),
    },
    input: {
        flex: 1,
        height: scale(50),
        paddingVertical: 0,
        fontSize: FontSizes.bodyLarge,
        color: Colors.text,
        fontFamily: Fonts.regular,
        textAlignVertical: "center",
    },
    clearBtn: {
        padding: Spacing.xs,
    },
});
