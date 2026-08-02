import { useAuthState } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { triggerHaptic } from "@/utils";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import * as Sentry from "@sentry/react-native";
import { useMutation } from "convex/react";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as ImagePicker from "expo-image-picker";
import { usePathname, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";

// ─── Constants ───────────────────────────────────────────────────────────────

const BUG_CATEGORIES = [
    "App Crash",
    "Login",
    "Authentication",
    "Payment",
    "Book Rental",
    "Delivery",
    "UI / UX",
    "Performance",
    "Notifications",
    "Other",
] as const;

type BugCategory = (typeof BUG_CATEGORIES)[number];

const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024; // 5 MB

const FIELD_LIMITS = {
    title: { min: 5, max: 120 },
    description: { min: 10, max: 2000 },
    steps: { max: 1500 },
    expected: { max: 1000 },
    actual: { max: 1000 },
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

interface BugReportFormErrors {
    title?: string;
    category?: string;
    description?: string;
    steps?: string;
    expected?: string;
    actual?: string;
}

interface SubmitResult {
    reportId: string;
    githubIssueNumber?: number;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

// ─── Device Info Collector ───────────────────────────────────────────────────

interface DeviceInfoPayload {
    userId: string;
    email: string;
    phone: string;
    currentScreen: string;
    appVersion: string;
    buildNumber: string;
    platform: string;
    osVersion: string;
    deviceModel: string;
    manufacturer: string;
    timestamp: string;
    timezone: string;
    language: string;
    networkStatus: string;
    sentryEventId: string;
    analyticsSessionId: string;
}

function collectDeviceInfo(
    userId: string | undefined,
    email: string | undefined,
    phone: string | undefined,
    currentScreen: string,
    isOnline: boolean
): DeviceInfoPayload {
    let sentryEventId = "N/A";
    try {
        const lastId = Sentry.lastEventId?.();
        if (lastId) sentryEventId = lastId;
    } catch {
        // Sentry may not be initialized
    }

    return {
        userId: userId ?? "N/A",
        email: email ?? "N/A",
        phone: phone ?? "N/A",
        currentScreen,
        appVersion: Constants.expoConfig?.version ?? "1.0.1",
        buildNumber: String(
            Platform.OS === "android"
                ? Constants.expoConfig?.android?.versionCode ?? "N/A"
                : Constants.expoConfig?.ios?.buildNumber ?? "N/A"
        ),
        platform: Platform.OS,
        osVersion: `${Device.osName ?? ""} ${Device.osVersion ?? ""}`.trim(),
        deviceModel: Device.modelName ?? "Unknown",
        manufacturer: Device.manufacturer ?? "Unknown",
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: Intl.DateTimeFormat().resolvedOptions().locale ?? "en",
        networkStatus: isOnline ? "Online" : "Offline",
        sentryEventId,
        analyticsSessionId: "N/A",
    };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBugReport() {
    const { accessToken, user } = useAuthState();
    const { showToast } = useToast();
    const { isOnline } = useNetworkStatus();
    const router = useRouter();
    const pathname = usePathname();

    const generateUploadUrl = useMutation(api.bugReports.generateUploadUrl);
    const submitBugReportMutation = useMutation(api.bugReports.submitBugReport);

    // Form state
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [stepsToReproduce, setStepsToReproduce] = useState("");
    const [expectedBehaviour, setExpectedBehaviour] = useState("");
    const [actualBehaviour, setActualBehaviour] = useState("");
    const [contactMe, setContactMe] = useState(false);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [errors, setErrors] = useState<BugReportFormErrors>({});

    // Submission state
    const [submitState, setSubmitState] = useState<SubmitState>("idle");
    const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

    // ─── Validation ──────────────────────────────────────────────────────

    const validate = useCallback((): boolean => {
        const newErrors: BugReportFormErrors = {};
        const trimmedTitle = title.trim();
        const trimmedDesc = description.trim();

        if (!trimmedTitle) {
            newErrors.title = "Title is required.";
        } else if (trimmedTitle.length < FIELD_LIMITS.title.min) {
            newErrors.title = `Title must be at least ${FIELD_LIMITS.title.min} characters.`;
        } else if (trimmedTitle.length > FIELD_LIMITS.title.max) {
            newErrors.title = `Title must be under ${FIELD_LIMITS.title.max} characters.`;
        }

        if (!category) {
            newErrors.category = "Please select a category.";
        }

        if (!trimmedDesc) {
            newErrors.description = "Description is required.";
        } else if (trimmedDesc.length < FIELD_LIMITS.description.min) {
            newErrors.description = `Description must be at least ${FIELD_LIMITS.description.min} characters.`;
        } else if (trimmedDesc.length > FIELD_LIMITS.description.max) {
            newErrors.description = `Description must be under ${FIELD_LIMITS.description.max} characters.`;
        }

        if (stepsToReproduce.trim().length > FIELD_LIMITS.steps.max) {
            newErrors.steps = `Must be under ${FIELD_LIMITS.steps.max} characters.`;
        }
        if (expectedBehaviour.trim().length > FIELD_LIMITS.expected.max) {
            newErrors.expected = `Must be under ${FIELD_LIMITS.expected.max} characters.`;
        }
        if (actualBehaviour.trim().length > FIELD_LIMITS.actual.max) {
            newErrors.actual = `Must be under ${FIELD_LIMITS.actual.max} characters.`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [title, category, description, stepsToReproduce, expectedBehaviour, actualBehaviour]);

    // ─── Image Picker ────────────────────────────────────────────────────

    const pickImage = useCallback(async (source: "gallery" | "camera") => {
        triggerHaptic("light");

        const options: ImagePicker.ImagePickerOptions = {
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: false,
        };

        const result =
            source === "camera"
                ? await ImagePicker.launchCameraAsync(options)
                : await ImagePicker.launchImageLibraryAsync(options);

        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];

        // Client-side file size check
        if (asset.fileSize && asset.fileSize > MAX_SCREENSHOT_SIZE) {
            showToast("Image must be under 5 MB. Please choose a smaller image.", "error");
            return;
        }

        // MIME type check
        const mimeType = asset.mimeType ?? asset.uri.split(".").pop()?.toLowerCase();
        const allowed = ["jpeg", "jpg", "png", "webp", "image/jpeg", "image/png", "image/webp"];
        if (mimeType && !allowed.includes(mimeType)) {
            showToast("Only JPEG, PNG, or WebP images are accepted.", "error");
            return;
        }

        setImageUri(asset.uri);
    }, [showToast]);

    const clearImage = useCallback(() => {
        setImageUri(null);
    }, []);

    // ─── Submit ──────────────────────────────────────────────────────────

    const handleSubmit = useCallback(async () => {
        // Prevent duplicate submissions
        if (isSubmittingRef.current) return;

        if (!accessToken) {
            showToast("Please sign in to continue.", "error");
            return;
        }

        if (!isOnline) {
            showToast("No internet connection. Please check your network and try again.", "error");
            return;
        }

        if (!validate()) {
            triggerHaptic("warning");
            showToast("Please fix the errors above.", "error");
            return;
        }

        isSubmittingRef.current = true;
        setSubmitting(true);
        setSubmitState("submitting");

        try {
            // Collect device info
            const deviceInfo = collectDeviceInfo(
                user?._id,
                user?.email,
                user?.phone,
                pathname,
                isOnline
            );

            // Upload screenshot if provided
            let screenshotId: Id<"_storage"> | undefined;
            if (imageUri) {
                const uploadUrl = await generateUploadUrl({ accessToken });
                const response = await fetch(imageUri);
                const blob = await response.blob();

                if (blob.size > MAX_SCREENSHOT_SIZE) {
                    showToast("Image must be under 5 MB.", "error");
                    setSubmitting(false);
                    setSubmitState("idle");
                    isSubmittingRef.current = false;
                    return;
                }

                const uploadResponse = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": blob.type || "image/jpeg" },
                    body: blob,
                });

                if (!uploadResponse.ok) {
                    throw new Error("Failed to upload screenshot.");
                }

                const { storageId } = await uploadResponse.json();
                screenshotId = storageId as Id<"_storage">;
            }

            // Submit report
            const result = await submitBugReportMutation({
                accessToken,
                title: title.trim(),
                category,
                description: description.trim(),
                stepsToReproduce: stepsToReproduce.trim() || undefined,
                expectedBehaviour: expectedBehaviour.trim() || undefined,
                actualBehaviour: actualBehaviour.trim() || undefined,
                screenshotId,
                contactMe,
                deviceInfo: JSON.stringify(deviceInfo),
            });

            triggerHaptic("success");
            setSubmitResult({
                reportId: result.reportId,
            });
            setSubmitState("success");
        } catch (error: unknown) {
            triggerHaptic("error");
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to submit report. Please try again.";
            showToast(message, "error");
            setSubmitState("error");
        } finally {
            setSubmitting(false);
            isSubmittingRef.current = false;
        }
    }, [
        accessToken,
        isOnline,
        validate,
        user,
        pathname,
        imageUri,
        title,
        category,
        description,
        stepsToReproduce,
        expectedBehaviour,
        actualBehaviour,
        contactMe,
        generateUploadUrl,
        submitBugReportMutation,
        showToast,
    ]);

    // ─── Reset Form ──────────────────────────────────────────────────────

    const resetForm = useCallback(() => {
        setTitle("");
        setCategory("");
        setDescription("");
        setStepsToReproduce("");
        setExpectedBehaviour("");
        setActualBehaviour("");
        setContactMe(false);
        setImageUri(null);
        setErrors({});
        setSubmitState("idle");
        setSubmitResult(null);
    }, []);

    return {
        // Constants
        categories: BUG_CATEGORIES,
        fieldLimits: FIELD_LIMITS,

        // Form state
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

        // Image actions
        pickImage,
        clearImage,

        // Submission
        submitting,
        submitState,
        submitResult,
        handleSubmit,
        resetForm,
    };
}
