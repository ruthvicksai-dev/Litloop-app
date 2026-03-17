import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
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
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.md,
        gap: 8,
    },
    icon: {
        fontSize: FontSizes.subtitle,
    },
    input: {
        flex: 1,
        minHeight: 46,
        paddingVertical: 10,
        fontSize: FontSizes.bodyLarge,
        color: Colors.text,
        fontFamily: Fonts.regular,
    },
});
