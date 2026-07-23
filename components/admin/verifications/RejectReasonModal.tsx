import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import Button from "@/components/ui/core/Button";
import KeyboardAwareScrollView from "@/components/ui/core/KeyboardAwareScrollView";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";

/** Inline modal that prompts admin for a rejection reason before rejecting a payment. */
export default function RejectReasonModal({
    visible,
    reason,
    setReason,
    loading,
    onConfirm,
    onCancel,
}: {
    visible: boolean;
    reason: string;
    setReason: (v: string) => void;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!visible) return null;

    return (
        <KeyboardAwareScrollView
            style={StyleSheet.absoluteFillObject}
            contentContainerStyle={rejectStyles.overlay}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
        >
            <View style={rejectStyles.card}>
                <Text style={rejectStyles.title}>Reject Payment</Text>
                <Text style={rejectStyles.subtitle}>
                    Provide a reason so the user knows why their payment was rejected.
                </Text>
                <TextInput
                    style={rejectStyles.input}
                    placeholder="e.g., UTR does not match, amount incorrect"
                    placeholderTextColor={Colors.textLight}
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                    autoFocus
                />
                <View style={rejectStyles.actions}>
                    <Button
                        title="Cancel"
                        onPress={onCancel}
                        variant="outline"
                        style={rejectStyles.btn}
                    />
                    <Button
                        title="Reject"
                        onPress={onConfirm}
                        loading={loading}
                        style={[rejectStyles.btn, { backgroundColor: Colors.error }]}
                    />
                </View>
            </View>
        </KeyboardAwareScrollView>
    );
}

const rejectStyles = StyleSheet.create({
    overlay: {
        flexGrow: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        alignItems: "center",
        padding: Spacing.lg,
        zIndex: 100,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.lg,
        width: "100%",
        maxWidth: 400,
    },
    title: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
        lineHeight: scale(20),
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Layout.borderRadius,
        padding: Spacing.sm,
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        minHeight: scale(80),
        textAlignVertical: "top",
        marginBottom: Spacing.md,
    },
    actions: {
        flexDirection: "row",
        gap: Spacing.md,
    },
    btn: {
        flex: 1,
    },
});
