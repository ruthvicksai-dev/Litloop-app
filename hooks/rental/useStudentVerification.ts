import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";

/** Max upload size for student ID cards: 1 MB */
const MAX_ID_CARD_SIZE = 1 * 1024 * 1024;

export function useStudentVerification() {
    const { accessToken, user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const generateUploadUrl = useMutation(api.verifications.generateUploadUrl);
    const submitVerification = useMutation(api.verifications.submitVerification);

    const verification = useQuery(
        api.verifications.getUserVerification,
        accessToken ? { accessToken } : "skip"
    );

    const [studentIdNumber, setStudentIdNumber] = useState("");
    const [fullNameOnId, setFullNameOnId] = useState("");
    const [department, setDepartment] = useState("");
    const [year, setYear] = useState("");
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
        });

        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];

        // Client-side file size check
        if (asset.fileSize && asset.fileSize > MAX_ID_CARD_SIZE) {
            showToast("Image must be under 1 MB. Please compress or choose a smaller image.", "error");
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
    };

    const handleSubmit = async () => {
        if (!accessToken) {
            showToast("Please sign in to continue.", "error");
            return;
        }
        if (!imageUri) {
            showToast("Please upload your student ID card image.", "error");
            return;
        }
        if (!studentIdNumber.trim()) {
            showToast("Please enter your student ID number.", "error");
            return;
        }
        if (!fullNameOnId.trim()) {
            showToast("Please enter your full name as on your ID card.", "error");
            return;
        }

        setSubmitting(true);
        try {
            // Step 1: Generate upload URL
            const uploadUrl = await generateUploadUrl({ accessToken });

            // Step 2: Upload the image
            const response = await fetch(imageUri);
            const blob = await response.blob();

            if (blob.size > MAX_ID_CARD_SIZE) {
                showToast("Image must be under 1 MB. Please compress or choose a smaller image.", "error");
                setSubmitting(false);
                return;
            }

            const uploadResponse = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": blob.type || "image/jpeg" },
                body: blob,
            });

            if (!uploadResponse.ok) {
                throw new Error("Failed to upload ID card image.");
            }

            const { storageId } = await uploadResponse.json();

            // Step 3: Submit verification request
            await submitVerification({
                accessToken,
                studentIdNumber: studentIdNumber.trim(),
                fullNameOnId: fullNameOnId.trim(),
                department: department.trim() || undefined,
                year: year.trim() || undefined,
                idCardImageId: storageId as Id<"_storage">,
            });

            showToast("Verification submitted! We'll review it shortly.", "success");
            // Reset form
            setStudentIdNumber("");
            setFullNameOnId("");
            setDepartment("");
            setYear("");
            setImageUri(null);
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to submit verification. Please try again.";
            showToast(message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return {
        // Data
        verification,
        isVerified: user?.isVerifiedStudent === true,

        // Form state
        studentIdNumber,
        setStudentIdNumber,
        fullNameOnId,
        setFullNameOnId,
        department,
        setDepartment,
        year,
        setYear,
        imageUri,

        // Actions
        pickImage,
        handleSubmit,
        submitting,
    };
}
