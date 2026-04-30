import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface DropdownFieldProps {
    label: string;
    value: string;
    options: readonly string[];
    placeholder?: string;
    onSelect: (option: string) => void;
}

export default function DropdownField({
    label,
    value,
    options,
    placeholder = "Select an option",
    onSelect,
}: DropdownFieldProps) {
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
                style={styles.field}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.text, !value && styles.placeholder]}>
                    {value || placeholder}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textLight} />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setModalVisible(false)}
                >
                    <Pressable style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.list}
                        >
                            {options.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.option,
                                        value === option && styles.optionSelected,
                                    ]}
                                    onPress={() => {
                                        onSelect(option);
                                        setModalVisible(false);
                                    }}
                                >
                                    <View style={styles.optionContent}>
                                        <Text
                                            style={[
                                                styles.optionText,
                                                value === option && styles.optionTextSelected,
                                            ]}
                                        >
                                            {option}
                                        </Text>
                                        {value === option && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={20}
                                                color={Colors.primary}
                                            />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        marginBottom: 6,
        fontFamily: Fonts.medium,
        letterSpacing: 0.3,
        textTransform: "uppercase",
    },
    field: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        height: 48,
    },
    text: {
        fontSize: FontSizes.body,
        color: Colors.text,
        fontFamily: Fonts.regular,
        flex: 1,
    },
    placeholder: {
        color: Colors.textLight,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "80%",
        paddingBottom: Layout.screenPaddingWide,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    list: {
        padding: Spacing.md,
    },
    option: {
        paddingVertical: 14,
        paddingHorizontal: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border + "50",
    },
    optionContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    optionSelected: {
        backgroundColor: Colors.primary + "10",
        borderRadius: 8,
        borderBottomWidth: 0,
    },
    optionText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
    },
    optionTextSelected: {
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
});
