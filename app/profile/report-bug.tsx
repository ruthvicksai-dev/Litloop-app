import Button from "@/components/ui/core/Button";
import DropdownField from "@/components/ui/core/DropdownField";
import InputField from "@/components/ui/core/InputField";
import KeyboardAwareScrollView from "@/components/ui/core/KeyboardAwareScrollView";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useBugReport } from "@/hooks";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActionSheetIOS,
    ActivityIndicator,
    Image,
    Platform,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function ReportBugScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {
        categories,
        fieldLimits,
        title,
        setTitle,
        category,
        setCategory,
        description,
        setDescription,
        stepsToReproduce,
        setStepsToReproduce,
        expectedBehaviour,
        setExpectedBehaviour,
        actualBehaviour,
        setActualBehaviour,
        contactMe,
        setContactMe,
        imageUri,
        errors,
        pickImage,
        clearImage,
        submitting,
        submitState,
        submitResult,
        handleSubmit,
        resetForm,
    } = useBugReport();

    // ─── Image Source Picker ─────────────────────────────────────────────

    const handleImagePick = () => {
        triggerHaptic("light");
        if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ["Cancel", "Take Photo", "Choose from Gallery"],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) pickImage("camera");
                    else if (buttonIndex === 2) pickImage("gallery");
                }
            );
        } else {
            // On Android, default to gallery; camera can be added via a modal
            pickImage("gallery");
        }
    };

    // ─── Success State ───────────────────────────────────────────────────

    if (submitState === "success" && submitResult) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} allowFontScaling={false}>
                        Report Submitted
                    </Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.successCenter}>
                    <View style={styles.successIconWrap}>
                        <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
                    </View>
                    <Text style={styles.successTitle}>Thank you!</Text>
                    <Text style={styles.successSubtitle}>
                        Your report has been submitted successfully.
                    </Text>
                    <View style={styles.successCard}>
                        <View style={styles.successRow}>
                            <Text style={styles.successLabel}>Issue ID</Text>
                            <Text style={styles.successValue}>{submitResult.reportId}</Text>
                        </View>
                        {submitResult.githubIssueNumber ? (
                            <View style={styles.successRow}>
                                <Text style={styles.successLabel}>GitHub Issue</Text>
                                <Text style={styles.successValue}>
                                    #{submitResult.githubIssueNumber}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                    <Text style={styles.successHeart}>
                        We appreciate your feedback ❤️
                    </Text>
                    <View style={styles.successActions}>
                        <Button
                            title="Submit Another"
                            onPress={() => {
                                triggerHaptic("light");
                                resetForm();
                            }}
                            variant="outline"
                            style={{ flex: 1 }}
                        />
                        <Button
                            title="My Reports"
                            onPress={() => {
                                triggerHaptic("light");
                                resetForm();
                                router.replace("/profile/my-reports");
                            }}
                            style={{ flex: 1 }}
                        />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // ─── Form ────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1 }}>
                <KeyboardAwareScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: Math.max(Spacing.xl, insets.bottom + 20) },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="none"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={24} color={Colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle} allowFontScaling={false}>
                            Report a Bug
                        </Text>
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
                                <Ionicons name="bug-outline" size={20} color={Colors.primary} />
                            </View>
                            <Text style={styles.infoEyebrow}>Bug Report</Text>
                        </View>
                        <Text style={styles.infoTitle}>Found an issue?</Text>
                        <Text style={styles.infoText}>
                            Help us improve LitLoop by reporting bugs you encounter. Provide as
                            much detail as possible so our team can investigate and fix the issue
                            quickly.
                        </Text>
                        <View style={styles.requirementsList}>
                            <RequirementItem
                                icon="document-text-outline"
                                text="Be descriptive — include what you were doing"
                            />
                            <RequirementItem
                                icon="camera-outline"
                                text="Attach a screenshot if possible"
                            />
                            <RequirementItem
                                icon="footsteps-outline"
                                text="Include steps to reproduce the issue"
                            />
                        </View>
                    </LinearGradient>

                    {/* Form Fields */}
                    <View style={styles.formSection}>
                        {/* Title */}
                        <InputField
                            label="Bug Title *"
                            placeholder="e.g., Payment page crashes on checkout"
                            value={title}
                            onChangeText={setTitle}
                            error={errors.title}
                            maxLength={fieldLimits.title.max}
                        />
                        <CharCounter
                            current={title.length}
                            max={fieldLimits.title.max}
                        />

                        {/* Category */}
                        <DropdownField
                            label="Category *"
                            value={category}
                            options={categories}
                            placeholder="Select a category"
                            onSelect={setCategory}
                        />
                        {errors.category ? (
                            <View style={styles.errorRow}>
                                <Ionicons name="close-circle" size={14} color={Colors.error} />
                                <Text style={styles.errorText}>{errors.category}</Text>
                            </View>
                        ) : null}

                        {/* Description */}
                        <InputField
                            label="Description *"
                            placeholder="Describe the bug in detail..."
                            value={description}
                            onChangeText={setDescription}
                            error={errors.description}
                            multiline
                            numberOfLines={5}
                            maxLength={fieldLimits.description.max}
                        />
                        <CharCounter
                            current={description.length}
                            max={fieldLimits.description.max}
                        />

                        {/* Steps to Reproduce */}
                        <InputField
                            label="Steps to Reproduce"
                            placeholder={"1. Go to...\n2. Tap on...\n3. See error"}
                            value={stepsToReproduce}
                            onChangeText={setStepsToReproduce}
                            error={errors.steps}
                            multiline
                            numberOfLines={4}
                            maxLength={fieldLimits.steps.max}
                        />
                        {stepsToReproduce.length > 0 ? (
                            <CharCounter
                                current={stepsToReproduce.length}
                                max={fieldLimits.steps.max}
                            />
                        ) : null}

                        {/* Expected Behaviour */}
                        <InputField
                            label="Expected Behaviour"
                            placeholder="What should have happened?"
                            value={expectedBehaviour}
                            onChangeText={setExpectedBehaviour}
                            error={errors.expected}
                            multiline
                            numberOfLines={3}
                            maxLength={fieldLimits.expected.max}
                        />

                        {/* Actual Behaviour */}
                        <InputField
                            label="Actual Behaviour"
                            placeholder="What actually happened?"
                            value={actualBehaviour}
                            onChangeText={setActualBehaviour}
                            error={errors.actual}
                            multiline
                            numberOfLines={3}
                            maxLength={fieldLimits.actual.max}
                        />

                        {/* Screenshot */}
                        <Text style={styles.fieldLabel}>Attach Screenshot (optional)</Text>
                        <Text style={styles.uploadHint}>
                            JPEG, PNG, or WebP. Under 5 MB.
                        </Text>
                        <TouchableOpacity
                            style={styles.uploadArea}
                            onPress={submitting ? undefined : handleImagePick}
                            activeOpacity={submitting ? 1 : 0.7}
                        >
                            {imageUri ? (
                                <View style={styles.previewContainer}>
                                    <Image
                                        source={{ uri: imageUri }}
                                        style={styles.uploadPreview}
                                    />
                                    {submitting ? (
                                        <View style={styles.uploadingOverlay}>
                                            <ActivityIndicator size="small" color={Colors.white} />
                                            <Text style={styles.uploadingText}>
                                                Uploading...
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons
                                        name="cloud-upload-outline"
                                        size={32}
                                        color={Colors.primary}
                                    />
                                    <Text style={styles.uploadPlaceholderText}>
                                        Tap to attach screenshot
                                    </Text>
                                    <Text style={styles.uploadPlaceholderHint}>
                                        Gallery{Platform.OS === "ios" ? " or Camera" : ""}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        {imageUri && !submitting ? (
                            <TouchableOpacity
                                style={styles.removeLink}
                                onPress={clearImage}
                                activeOpacity={0.6}
                            >
                                <Ionicons
                                    name="trash-outline"
                                    size={14}
                                    color={Colors.textSecondary}
                                />
                                <Text style={styles.removeLinkText}>Remove photo</Text>
                            </TouchableOpacity>
                        ) : null}

                        {/* Contact Switch */}
                        <View style={styles.switchRow}>
                            <View style={styles.switchContent}>
                                <Text style={styles.switchLabel}>
                                    Contact me regarding this issue
                                </Text>
                                <Text style={styles.switchHint}>
                                    Allow our team to reach out for more details
                                </Text>
                            </View>
                            <Switch
                                value={contactMe}
                                onValueChange={(val) => {
                                    triggerHaptic("light");
                                    setContactMe(val);
                                }}
                                trackColor={{ false: Colors.border, true: Colors.primary }}
                                thumbColor={Colors.white}
                            />
                        </View>

                        {/* Submit */}
                        <Button
                            title="Submit Bug Report"
                            onPress={handleSubmit}
                            loading={submitting}
                            disabled={submitting}
                            icon="send-outline"
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

function CharCounter({ current, max }: { current: number; max: number }) {
    const isNearLimit = current > max * 0.85;
    const isOverLimit = current > max;
    return (
        <Text
            style={[
                styles.charCounter,
                isNearLimit && styles.charCounterWarn,
                isOverLimit && styles.charCounterError,
            ]}
        >
            {current}/{max}
        </Text>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {},
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

    // Info card (matches verify.tsx)
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

    // Form
    formSection: {
        paddingHorizontal: 20,
    },
    fieldLabel: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.xs,
        marginTop: Spacing.sm,
        letterSpacing: 0.1,
    },
    charCounter: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.regular,
        color: Colors.textLight,
        textAlign: "right",
        marginTop: -Spacing.sm,
        marginBottom: Spacing.xs,
    },
    charCounterWarn: {
        color: Colors.warning,
    },
    charCounterError: {
        color: Colors.error,
    },
    errorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: -Spacing.sm,
        marginBottom: Spacing.sm,
    },
    errorText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.error,
    },

    // Upload (matches verify.tsx)
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
        minHeight: 160,
        justifyContent: "center",
        alignItems: "center",
    },
    previewContainer: {
        width: "100%",
        height: 200,
        justifyContent: "center",
        alignItems: "center",
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
    uploadPlaceholderHint: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textLight,
    },
    uploadPreview: {
        width: "100%",
        height: 200,
        resizeMode: "contain",
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.65)",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        gap: Spacing.xs,
        borderRadius: 14,
    },
    uploadingText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.white,
    },
    removeLink: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-end",
        gap: 4,
        marginTop: Spacing.xs,
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    removeLinkText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },

    // Contact switch
    switchRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.surfaceCard,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginTop: Spacing.lg,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
        gap: 12,
    },
    switchContent: {
        flex: 1,
    },
    switchLabel: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    switchHint: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 2,
    },

    // Submit
    submitButton: {
        marginTop: Spacing.lg,
    },

    // Success state (matches verify.tsx pattern)
    successCenter: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 30,
        gap: Spacing.md,
    },
    successIconWrap: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: Colors.success + "15",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: Spacing.sm,
    },
    successTitle: {
        fontSize: FontSizes.heading,
        fontFamily: Fonts.bold,
        color: Colors.text,
        textAlign: "center",
    },
    successSubtitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        textAlign: "center",
        lineHeight: 22,
    },
    successCard: {
        backgroundColor: Colors.surfaceCard,
        borderRadius: 16,
        padding: Spacing.md,
        width: "100%",
        gap: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    successRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    successLabel: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    successValue: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    successHeart: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.primaryDark,
        textAlign: "center",
    },
    successActions: {
        flexDirection: "row",
        gap: Spacing.sm,
        width: "100%",
        marginTop: Spacing.sm,
    },
});
