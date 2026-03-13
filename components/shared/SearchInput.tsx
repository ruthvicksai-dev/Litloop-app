import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import { Dimensions, StyleProp, StyleSheet, Text, TextInput, TextStyle, View, ViewStyle } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type SearchInputProps = {
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    containerStyle?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    icon?: string;
};

export default function SearchInput({
    value,
    onChangeText,
    placeholder,
    containerStyle,
    inputStyle,
    icon,
}: SearchInputProps) {
    return (
        <View style={[styles.container, containerStyle]}>
            {icon ? <Text style={styles.icon}>{icon}</Text> : null}
            <TextInput
                style={[styles.input, inputStyle]}
                placeholder={placeholder}
                placeholderTextColor={Colors.textLight}
                value={value}
                onChangeText={onChangeText}
            />
        </View>
    );
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
        fontSize: 16,
    },
    input: {
        flex: 1,
        paddingVertical: SCREEN_WIDTH * 0.04,
        fontSize: 15,
        color: Colors.text,
    },
});
