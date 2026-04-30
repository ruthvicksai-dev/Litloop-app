import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import { getDetailIcon } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type DetailRowProps = {
    label: string;
    value: string;
    highlight?: boolean;
};

export function HistoryDetailTile({ label, value, highlight = false }: DetailRowProps) {
    return (
        <View style={styles.detailTile}>
            <View style={styles.detailTop}>
                <View style={[styles.detailIconWrap, highlight && styles.detailIconWrapHighlight]}>
                    <Ionicons
                        name={getDetailIcon(label)}
                        size={12}
                        color={highlight ? Colors.primary : Colors.white}
                    />
                </View>
                <Text
                    style={[styles.detailLabel, highlight && styles.detailLabelHighlight]}
                    allowFontScaling={false}
                >
                    {label}
                </Text>
            </View>
            <Text
                numberOfLines={2}
                style={[styles.detailValue, highlight && styles.detailValueHighlight]}
                allowFontScaling={false}
            >
                {value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    detailTile: {
        width: "48%",
    },
    detailTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 6,
    },
    detailIconWrap: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    detailIconWrapHighlight: {
        backgroundColor: Colors.primaryLight,
    },
    detailLabel: {
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
    },
    detailLabelHighlight: {
        color: Colors.primary,
    },
    detailValue: {
        fontSize: FontSizes.small,
        color: Colors.text,
        fontFamily: Fonts.medium,
        lineHeight: 17,
        paddingLeft: 26,
    },
    detailValueHighlight: {
        color: Colors.primary,
        fontFamily: Fonts.bold,
    },
});
