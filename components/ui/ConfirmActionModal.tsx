import Button from "@/components/ui/Button";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type ConfirmActionModalProps = {
    visible: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    tone?: "default" | "danger";
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
}: ConfirmActionModalProps) {
    const isDanger = tone === "danger";

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
                    <View style={styles.actions}>
                        <Button
                            title={cancelLabel}
                            onPress={onCancel}
                            variant="outline"
                            style={styles.button}
                        />
                        <Button
                            title={confirmLabel}
                            onPress={onConfirm}
                            style={[
                                styles.button,
                                isDanger && styles.confirmDanger,
                            ]}
                        />
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
    button: {
        flex: 1,
    },
    confirmDanger: {
        backgroundColor: Colors.error,
    },
});
