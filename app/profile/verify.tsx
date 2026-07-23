import VerifiedBadge from "@/components/ui/feedback/VerifiedBadge";
import Button from "@/components/ui/core/Button";
import KeyboardAwareScrollView from "@/components/ui/core/KeyboardAwareScrollView";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useStudentVerification } from "@/hooks";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function VerifyStudentScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {
        verification,
        isVerified,
        studentIdNumber,
        setStudentIdNumber,
        fullNameOnId,
        setFullNameOnId,
        department,
        setDepartment,
        year,
        setYear,
        imageUri,
        pickImage,
        handleSubmit,
        submitting,
    } = useStudentVerification();

    // ─── Already Verified ────────────────────────────────────────────────
    if (isVerified) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Student Verification</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.statusCenter}>
                    <View style={styles.statusIconWrap}>
                        <Ionicons name="shield-checkmark" size={48} color={Colors.success} />
                    </View>
                    <Text style={styles.statusTitle}>Already Verified!</Text>
                    <Text style={styles.statusSubtitle}>
                        Your student status at KITS has been verified. You have full access to
                        College Zone delivery.
                    </Text>
                    <VerifiedBadge variant="card" />
                </View>
            </SafeAreaView>
        );
    }

    // ─── Pending State ───────────────────────────────────────────────────
    if (verification?.status === "pending") {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Student Verification</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.statusCenter}>
                    <View style={[styles.statusIconWrap, { backgroundColor: Colors.warning + "15" }]}>
                        <Ionicons name="time-outline" size={48} color={Colors.warning} />
                    </View>
                    <Text style={styles.statusTitle}>Under Review</Text>
                    <Text style={styles.statusSubtitle}>
                        Your verification request is being reviewed by our team. This usually takes
                        a few hours. You will receive a notification once it is processed.
                    </Text>
                    <View style={styles.pendingCard}>
                        <DetailItem label="Name on ID" value={verification.fullNameOnId} />
                        <DetailItem label="Student ID" value={verification.studentIdNumber} />
                        {verification.department ? (
                            <DetailItem label="Department" value={verification.department} />
                        ) : null}
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // ─── Rejected State (with cooldown info) ─────────────────────────────
    const isRejected = verification?.status === "rejected";
    const cooldownRemaining = isRejected && verification?.updatedAt
        ? Math.max(0, 24 * 60 * 60 * 1000 - (Date.now() - verification.updatedAt))
        : 0;
    const cooldownHours = Math.ceil(cooldownRemaining / (60 * 60 * 1000));
    const isCoolingDown = cooldownRemaining > 0;

    // ─── Loading ─────────────────────────────────────────────────────────
    if (verification === undefined) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Student Verification</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.statusCenter}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    // ─── Submission Form ─────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1 }}>
                <KeyboardAwareScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(120, 80 + insets.bottom) }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={24} color={Colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Verify Student</Text>
                        <View style={styles.headerSpacer} />
                    </View>

                    {/* Info Card */}
                    <LinearGradient
                        colors={["#FFFFFF", "#F7EAD8", "#F2DDC8"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.infoCard}
                    >
                        <View style={styles.infoIconRow}>
                            <View style={styles.infoIconWrap}>
                                <Ionicons name="school-outline" size={20} color={Colors.primary} />
                            </View>
                            <Text style={styles.infoEyebrow}>KITS Vinjanampadu</Text>
                        </View>
                        <Text style={styles.infoTitle}>College Zone Verification</Text>
                        <Text style={styles.infoText}>
                            To place orders in the College Zone, you need to verify your student
                            status. Upload a clear photo of your college ID card and fill in the
                            details below.
                        </Text>
                        <View style={styles.requirementsList}>
                            <RequirementItem icon="camera-outline" text="Take a clear, well-lit photo of your ID card" />
                            <RequirementItem icon="resize-outline" text="Image must be under 1 MB (JPEG/PNG/WebP)" />
                            <RequirementItem icon="text-outline" text="Ensure all text on the ID is readable" />
                            <RequirementItem icon="time-outline" text="Verification usually takes a few hours" />
                        </View>
                    </LinearGradient>

                    {/* Rejection Banner */}
                    {isRejected && (
                        <View style={styles.rejectionBanner}>
                            <Ionicons name="close-circle" size={18} color={Colors.error} />
                            <View style={styles.rejectionTextWrap}>
                                <Text style={styles.rejectionTitle}>Previous Request Rejected</Text>
                                <Text style={styles.rejectionReason}>
                                    {verification?.rejectionReason || "Please resubmit with a clearer photo."}
                                </Text>
                                {isCoolingDown && (
                                    <Text style={styles.cooldownText}>
                                        You can resubmit in {cooldownHours} hour{cooldownHours > 1 ? "s" : ""}.
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Form */}
                    <View style={styles.formSection}>
                        <Text style={styles.label}>Full Name (as on ID card) *</Text>
                        <TextInput
                            style={styles.input}
                            value={fullNameOnId}
                            onChangeText={setFullNameOnId}
                            placeholder="e.g., Sai Kumar Reddy"
                            placeholderTextColor={Colors.textLight}
                            editable={!isCoolingDown}
                        />

                        <Text style={styles.label}>Student ID Number *</Text>
                        <TextInput
                            style={styles.input}
                            value={studentIdNumber}
                            onChangeText={setStudentIdNumber}
                            placeholder="e.g., 21B01A0512"
                            placeholderTextColor={Colors.textLight}
                            autoCapitalize="characters"
                            editable={!isCoolingDown}
                        />

                        <Text style={styles.label}>Department</Text>
                        <TextInput
                            style={styles.input}
                            value={department}
                            onChangeText={setDepartment}
                            placeholder="e.g., CSE, ECE, MECH"
                            placeholderTextColor={Colors.textLight}
                            editable={!isCoolingDown}
                        />

                        <Text style={styles.label}>Year of Study</Text>
                        <TextInput
                            style={styles.input}
                            value={year}
                            onChangeText={setYear}
                            placeholder="e.g., 3rd Year"
                            placeholderTextColor={Colors.textLight}
                            editable={!isCoolingDown}
                        />

                        {/* ID Card Upload */}
                        <Text style={styles.label}>Student ID Card Image *</Text>
                        <Text style={styles.uploadHint}>
                            Must be under 1 MB. Only JPEG, PNG, or WebP.
                        </Text>
                        <TouchableOpacity
                            style={[styles.uploadArea, isCoolingDown && styles.uploadDisabled]}
                            onPress={isCoolingDown ? undefined : pickImage}
                            activeOpacity={isCoolingDown ? 1 : 0.7}
                        >
                            {imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.uploadPreview} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
                                    <Text style={styles.uploadPlaceholderText}>
                                        Tap to upload ID card photo
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <Button
                            title={isCoolingDown ? `Wait ${cooldownHours}h to Resubmit` : "Submit for Verification"}
                            onPress={handleSubmit}
                            loading={submitting}
                            disabled={isCoolingDown || submitting}
                            style={styles.submitButton}
                        />
                    </View>
                </KeyboardAwareScrollView>
            </View>
        </SafeAreaView>
    );
}

// ─── Small Helper Components ─────────────────────────────────────────────────

function RequirementItem({ icon, text }: { icon: string; text: string }) {
    return (
        <View style={styles.requirementRow}>
            <Ionicons name={icon as any} size={14} color={Colors.primary} />
            <Text style={styles.requirementText}>{text}</Text>
        </View>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: Spacing.md,
    },
    backBtn: {
        padding: 4,
        marginRight: Spacing.sm,
        marginLeft: -4,
    },
    headerTitle: {
        flex: 1,
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        textAlign: "center",
    },
    headerSpacer: {
        width: 32,
    },

    // Status screens
    statusCenter: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 30,
        gap: Spacing.md,
    },
    statusIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.success + "15",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: Spacing.sm,
    },
    statusTitle: {
        fontSize: FontSizes.heading,
        fontFamily: Fonts.bold,
        color: Colors.text,
        textAlign: "center",
    },
    statusSubtitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        textAlign: "center",
        lineHeight: 22,
    },

    // Pending detail card
    pendingCard: {
        backgroundColor: Colors.surfaceCard,
        borderRadius: 16,
        padding: Spacing.md,
        width: "100%",
        marginTop: Spacing.md,
        gap: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    detailLabel: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    detailValue: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },

    // Info card
    infoCard: {
        marginHorizontal: 20,
        borderRadius: 20,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
    },
    infoIconRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    infoIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.surfaceCard,
        justifyContent: "center",
        alignItems: "center",
    },
    infoEyebrow: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.primary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    infoTitle: {
        fontSize: FontSizes.titleLarge,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 4,
    },
    infoText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: Spacing.md,
    },
    requirementsList: {
        gap: Spacing.sm,
    },
    requirementRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    requirementText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.regular,
        color: Colors.text,
        flex: 1,
    },

    // Rejection banner
    rejectionBanner: {
        flexDirection: "row",
        backgroundColor: Colors.error + "10",
        borderWidth: 1,
        borderColor: Colors.error + "25",
        borderRadius: 12,
        padding: Spacing.md,
        marginHorizontal: 20,
        marginBottom: Spacing.md,
        gap: Spacing.sm,
        alignItems: "flex-start",
    },
    rejectionTextWrap: {
        flex: 1,
    },
    rejectionTitle: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
        color: Colors.error,
        marginBottom: 2,
    },
    rejectionReason: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    cooldownText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.warning,
        marginTop: 4,
    },

    // Form
    formSection: {
        paddingHorizontal: 20,
    },
    label: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
        marginBottom: Spacing.xs,
        marginTop: Spacing.md,
    },
    input: {
        backgroundColor: Colors.surfaceCard,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
    },

    // Upload
    uploadHint: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textLight,
        marginBottom: Spacing.sm,
    },
    uploadArea: {
        backgroundColor: Colors.surfaceCard,
        borderWidth: 2,
        borderColor: Colors.border,
        borderStyle: "dashed",
        borderRadius: 16,
        overflow: "hidden",
        minHeight: 180,
        justifyContent: "center",
        alignItems: "center",
    },
    uploadDisabled: {
        opacity: 0.5,
    },
    uploadPlaceholder: {
        alignItems: "center",
        gap: Spacing.sm,
        padding: Spacing.lg,
    },
    uploadPlaceholderText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.primary,
    },
    uploadPreview: {
        width: "100%",
        height: 220,
        resizeMode: "contain",
    },
    submitButton: {
        marginTop: Spacing.lg,
    },
});
