import Button from "@/components/ui/core/Button";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
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
                            name={isDanger ? "log-out-outline" : "help-outline"}
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
        flex: 1,
        backgroundColor: "rgba(28, 25, 23, 0.32)",
        justifyContent: "center",
        paddingHorizontal: Spacing.lg,
    },
    sheet: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: Spacing.xl,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 10,
    },
    iconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.md,
    },
    iconWrapDanger: {
        backgroundColor: Colors.error + "18",
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
