import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";

interface AdminBookActionsProps {
    onEditPress: () => void;
    onDeletePress: () => void;
}

export default function AdminBookActions({
    onEditPress,
    onDeletePress,
}: AdminBookActionsProps) {
    return (
        <View style={styles.actionsSection}>
            <TouchableOpacity
                style={styles.editBtn}
                onPress={onEditPress}
                activeOpacity={0.8}
            >
                <Ionicons name="create-outline" size={20} color={Colors.primary} />
                <Text style={styles.editBtnText}>Edit Book</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={onDeletePress}
                activeOpacity={0.8}
            >
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
                <Text style={styles.deleteBtnText}>Delete Book</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    actionsSection: {
        flexDirection: "row",
        gap: Spacing.md,
        marginTop: Spacing.sm,
    },
    editBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        backgroundColor: Colors.white,
    },
    editBtnText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    deleteBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.error,
        backgroundColor: Colors.error + "08",
    },
    deleteBtnText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.error,
    },
});
