import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";
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
            <Ionicons name="search" size={18} color={Colors.textLight} />
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
                >
                    <Ionicons name="close-circle" size={18} color={Colors.textLight} />
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
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
        minHeight: Layout.buttonHeight,
    },
    icon: {
        fontSize: FontSizes.subtitle,
    },
    input: {
        flex: 1,
        minHeight: Layout.buttonHeight - scale(2),
        paddingVertical: scale(10),
        fontSize: FontSizes.bodyLarge,
        color: Colors.text,
        fontFamily: Fonts.regular,
    },
});
