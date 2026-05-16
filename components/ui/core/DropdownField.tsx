import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { ModalStyles } from "@/constants/designTokens";
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
                <Ionicons name="chevron-down" size={18} color={Colors.textLight} />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setModalVisible(false)}
                >
                    <Pressable style={styles.modalContent}>
                        <View style={styles.handle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close" size={22} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.list}
                            bounces={false}
                        >
                            {options.map((option, index) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.option,
                                        value === option && styles.optionSelected,
                                        index === options.length - 1 && styles.optionLast,
                                    ]}
                                    onPress={() => {
                                        onSelect(option);
                                        setModalVisible(false);
                                    }}
                                    activeOpacity={0.7}
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
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.xs + 2,
        letterSpacing: 0.1,
    },
    field: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: Colors.surfaceCard,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: Spacing.md,
        height: Layout.buttonHeight,
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
        ...ModalStyles.bottomOverlay,
    },
    modalContent: {
        backgroundColor: Colors.surfaceCard,
        borderTopLeftRadius: Layout.cardRadiusLarge + 4,
        borderTopRightRadius: Layout.cardRadiusLarge + 4,
        maxHeight: "70%",
        paddingBottom: Spacing.xl,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: "center",
        marginTop: Spacing.sm + 2,
        marginBottom: Spacing.xs,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: Spacing.md + 4,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderSubtle,
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
        paddingHorizontal: Spacing.sm + 4,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderSubtle,
    },
    optionLast: {
        borderBottomWidth: 0,
    },
    optionContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    optionSelected: {
        backgroundColor: `${Colors.primary}0A`,
        borderRadius: 10,
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
