import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Requirement {
    label: string;
    met: boolean;
}

function getRequirements(password: string): Requirement[] {
    return [
        { label: "8+ characters", met: password.length >= 8 },
        { label: "Uppercase (A-Z)", met: /[A-Z]/.test(password) },
        { label: "Lowercase (a-z)", met: /[a-z]/.test(password) },
        { label: "Number (0-9)", met: /\d/.test(password) },
        { label: "Special char (!@#...)", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) },
        { label: "No spaces", met: password.length > 0 && !/\s/.test(password) },
    ];
}

export function allRequirementsMet(password: string): boolean {
    return getRequirements(password).every((r) => r.met);
}

interface Props {
    password: string;
}

export default function PasswordRequirements({ password }: Props) {
    if (password.length === 0) return null;

    const requirements = getRequirements(password);

    return (
        <View style={styles.container}>
            {/* Render in rows of 2 */}
            {Array.from({ length: Math.ceil(requirements.length / 2) }, (_, rowIdx) => (
                <View key={rowIdx} style={styles.row}>
                    {requirements.slice(rowIdx * 2, rowIdx * 2 + 2).map((req, i) => (
                        <View key={i} style={styles.item}>
                            <Ionicons
                                name={req.met ? "checkmark-circle" : "close-circle"}
                                size={14}
                                color={req.met ? Colors.success : Colors.error}
                            />
                            <Text
                                style={[styles.label, req.met && styles.labelMet]}
                                numberOfLines={1}
                            >
                                {req.label}
                            </Text>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: Spacing.xs,
        marginBottom: Spacing.md,
        paddingLeft: 5,
        gap: 4,
    },
    row: {
        flexDirection: "row",
        gap: Spacing.md,
    },
    item: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    label: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
    },
    labelMet: {
        color: Colors.success,
    },
});
