import InputField from "@/components/ui/core/InputField";
import { FontSizes, Fonts } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface CollegeZoneFieldsProps {
    roomNo: string;
    setRoomNo: (value: string) => void;
    yearOfStudy: string;
    setYearOfStudy: (value: string) => void;
    department: string;
    setDepartment: (value: string) => void;
    rollNo: string;
    setRollNo: (value: string) => void;
    isVerifiedStudent?: boolean;
    onVerifyPress?: () => void;
}

export default function CollegeZoneFields({
    roomNo,
    setRoomNo,
    yearOfStudy,
    setYearOfStudy,
    department,
    setDepartment,
    rollNo,
    setRollNo,
    isVerifiedStudent,
    onVerifyPress,
}: CollegeZoneFieldsProps) {
    return (
        <>
            <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={18} color={Colors.primary} />
                <Text style={styles.infoText}>
                    Note: Deliveries are only applicable to KITS college vinjanampadu.
                </Text>
            </View>

            <View style={styles.collegeZoneWrapper}>
                <View
                    style={[styles.collegeFieldsInner, !isVerifiedStudent && styles.blurredFields]}
                    pointerEvents={!isVerifiedStudent ? "none" : "auto"}
                >
                    <InputField
                        label="Room No"
                        placeholder="e.g. 205"
                        value={roomNo}
                        onChangeText={setRoomNo}
                    />
                    <View style={styles.row}>
                        <View style={[styles.halfField, styles.halfFieldSpacing]}>
                            <InputField
                                label="Year of Study"
                                placeholder="e.g. 3rd"
                                value={yearOfStudy}
                                onChangeText={setYearOfStudy}
                            />
                        </View>
                        <View style={styles.halfField}>
                            <InputField
                                label="Department"
                                placeholder="e.g. CSE"
                                value={department}
                                onChangeText={setDepartment}
                            />
                        </View>
                    </View>
                    <InputField
                        label="Roll No"
                        placeholder="e.g. 21K61A0501"
                        value={rollNo}
                        onChangeText={setRollNo}
                    />
                </View>

                {!isVerifiedStudent && (
                    <View style={styles.verifyOverlay}>
                        <View style={styles.verifyOverlayIconBg}>
                            <Ionicons name="lock-closed" size={24} color={Colors.primary} />
                        </View>
                        <Text style={styles.verifyOverlayTitle}>Verified Students Only</Text>
                        <Text style={styles.verifyOverlaySubtitle}>
                            You must verify your KITS student status to request delivery to the College Zone.
                        </Text>
                        <TouchableOpacity
                            style={styles.verifyOverlayBtn}
                            onPress={onVerifyPress}
                        >
                            <Text style={styles.verifyOverlayBtnText}>Verify Student Status</Text>
                            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
    },
    halfField: {
        flex: 1,
    },
    halfFieldSpacing: {
        marginRight: Spacing.sm,
    },
    infoBox: {
        flexDirection: "row",
        backgroundColor: Colors.primary + "10",
        padding: Spacing.sm,
        borderRadius: 12,
        marginBottom: Spacing.md,
        alignItems: "center",
    },
    infoText: {
        flex: 1,
        fontSize: FontSizes.small,
        color: Colors.primary,
        fontFamily: Fonts.medium,
        marginLeft: 8,
    },
    collegeZoneWrapper: {
        position: "relative",
        overflow: "hidden",
        borderRadius: 16,
        marginBottom: Spacing.md,
    },
    collegeFieldsInner: {
        paddingTop: 4,
    },
    blurredFields: {
        opacity: 0.25,
    },
    verifyOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255,255,255,0.7)",
        justifyContent: "center",
        alignItems: "center",
        padding: Spacing.lg,
        zIndex: 10,
    },
    verifyOverlayIconBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.surfaceCard,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    verifyOverlayTitle: {
        fontSize: FontSizes.bodyLarge,
        fontFamily: Fonts.bold,
        color: Colors.text,
        textAlign: "center",
        marginBottom: 4,
    },
    verifyOverlaySubtitle: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        textAlign: "center",
        marginBottom: Spacing.md,
        lineHeight: 18,
    },
    verifyOverlayBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 12,
        borderRadius: 24,
        gap: Spacing.sm,
    },
    verifyOverlayBtnText: {
        color: Colors.white,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.body,
    },
});
