import Button from "@/components/ui/core/Button";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { ModalStyles, Shadows } from "@/constants/designTokens";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

type ConfirmActionModalProps = {
    visible: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    tone?: "default" | "danger";
    loading?: boolean;
    stackActions?: boolean;
};

export default function ConfirmActionModal({
    visible,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    icon,
    tone = "default",
    loading = false,
    stackActions = false,
}: ConfirmActionModalProps) {
    const isDanger = tone === "danger";
    const { width } = useWindowDimensions();
    const shouldStackActions = stackActions || width < 390;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
                <View style={styles.sheet}>
                    <View
                        style={[
                            styles.iconWrap,
                            isDanger && styles.iconWrapDanger,
                        ]}
                    >
                        <Ionicons
                            name={icon ?? (isDanger ? "warning-outline" : "help-outline")}
                            size={22}
                            color={isDanger ? Colors.error : Colors.primary}
                        />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <View style={[styles.actions, shouldStackActions && styles.actionsStacked]}>
                        <View style={[styles.buttonWrap, shouldStackActions && styles.buttonWrapStacked]}>
                            <Button
                                title={cancelLabel}
                                onPress={onCancel}
                                variant="outline"
                                containerStyle={styles.buttonContainer}
                                style={styles.button}
                            />
                        </View>
                        <View style={[styles.buttonWrap, shouldStackActions && styles.buttonWrapStacked]}>
                            <Button
                                title={confirmLabel}
                                onPress={onConfirm}
                                loading={loading}
                                containerStyle={styles.buttonContainer}
                                style={[
                                    styles.button,
                                    isDanger && styles.confirmDanger,
                                ]}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...ModalStyles.overlay,
    },
    sheet: {
        backgroundColor: Colors.surfaceCard,
        borderRadius: 24,
        padding: Spacing.xl,
        ...Shadows.elevated,
    },
    iconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${Colors.primary}0C`,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: `${Colors.primary}12`,
    },
    iconWrapDanger: {
        backgroundColor: `${Colors.error}0C`,
        borderColor: `${Colors.error}12`,
    },
    title: {
        fontSize: FontSizes.titleLarge,
        color: Colors.text,
        marginBottom: Spacing.xs,
        fontFamily: Fonts.bold,
    },
    message: {
        fontSize: FontSizes.body,
        lineHeight: 22,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
        fontFamily: Fonts.regular,
    },
    actions: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
    actionsStacked: {
        flexDirection: "column",
    },
    buttonWrap: {
        flex: 1,
    },
    buttonWrapStacked: {
        width: "100%",
        flex: 0,
    },
    button: {
        width: "100%",
    },
    buttonContainer: {
        width: "100%",
        alignSelf: "stretch",
    },
    confirmDanger: {
        backgroundColor: Colors.error,
    },
});
