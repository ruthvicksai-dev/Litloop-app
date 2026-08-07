import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import { triggerHaptic } from "@/utils";

interface AdminBookActionsProps {
    onEditPress: () => void;
    onDeletePress: () => void;
}

export default function AdminBookActions({
    onEditPress,
    onDeletePress,
}: AdminBookActionsProps) {
    return (
        <View>
            <View style={styles.headerRow}>
                <Ionicons name="settings" size={16} color={Colors.primary} />
                <Text style={styles.headerTitle}>Admin Actions</Text>
            </View>
            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => {
                        triggerHaptic("light");
                        onEditPress();
                    }}
                    activeOpacity={0.8}
                >
                    <Ionicons name="create-outline" size={18} color={Colors.primary} />
                    <Text style={styles.editBtnText}>Edit Book</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => {
                        triggerHaptic("medium");
                        onDeletePress();
                    }}
                    activeOpacity={0.8}
                >
                    <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.04)",
    },
    headerTitle: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
        flex: 1,
        letterSpacing: 0.2,
    },
    actionsRow: {
        flexDirection: "row",
        gap: 10,
    },
    editBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: Colors.primary + "12",
    },
    editBtnText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    deleteBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: Colors.error + "10",
    },
    deleteBtnText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.error,
    },
});
