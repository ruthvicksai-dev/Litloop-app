import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Colors, Spacing } from "@/constants/theme";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentScreen() {
    const { rentalId } = useLocalSearchParams<{ rentalId: string }>();
    const rental = useQuery(api.rentals.getRental, {
        rentalId: rentalId as Id<"rentals">,
    });
    const { showToast } = useToast();
    const router = useRouter();

    const submitUpiPayment = useMutation(api.payments.submitUpiPayment);
    const selectCashPayment = useMutation(api.payments.selectCashPayment);
    const generateUploadUrl = useMutation(api.payments.generateUploadUrl);

    const [utrNumber, setUtrNumber] = useState("");
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash" | null>(
        null
    );

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setScreenshot(result.assets[0].uri);
        }
    };

    const handleUpiPayment = async () => {
        if (!utrNumber.trim()) {
            showToast("UTR number is required.", "error");
            return;
        }
        if (!screenshot) {
            showToast("Payment screenshot is required.", "error");
            return;
        }

        setUploading(true);
        try {
            // Upload screenshot to Convex
            const uploadUrl = await generateUploadUrl();
            const response = await fetch(screenshot);
            const blob = await response.blob();
            const uploadResult = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": blob.type || "image/jpeg" },
                body: blob,
            });
            const { storageId } = await uploadResult.json();

            await submitUpiPayment({
                rentalId: rentalId as Id<"rentals">,
                utrNumber,
                paymentScreenshot: storageId,
            });

            showToast("Payment submitted for verification!", "success");
            router.replace("/(tabs)/my-rentals");
        } catch (error: any) {
            showToast(error.message || "Payment submission failed.", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleCashPayment = async () => {
        setUploading(true);
        try {
            await selectCashPayment({
                rentalId: rentalId as Id<"rentals">,
            });
            showToast("Cash on pickup selected. Pay on pickup day.", "success");
            router.replace("/(tabs)/my-rentals");
        } catch (error: any) {
            showToast(error.message || "Failed to select cash payment.", "error");
        } finally {
            setUploading(false);
        }
    };

    if (!rental) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Payment</Text>
                <Text style={styles.subtitle}>{rental.book?.title}</Text>

                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Total Amount</Text>
                    <Text style={styles.amountValue}>₹{rental.totalRent || 0}</Text>
                </View>

                {/* Payment Method Selection */}
                <Text style={styles.sectionTitle}>Choose Payment Method</Text>
                <View style={styles.methodRow}>
                    <TouchableOpacity
                        style={[
                            styles.methodCard,
                            paymentMethod === "upi" && styles.methodActive,
                        ]}
                        onPress={() => setPaymentMethod("upi")}
                    >
                        <Text style={styles.methodIcon}>📱</Text>
                        <Text
                            style={[
                                styles.methodText,
                                paymentMethod === "upi" && styles.methodTextActive,
                            ]}
                        >
                            UPI
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.methodCard,
                            paymentMethod === "cash" && styles.methodActive,
                        ]}
                        onPress={() => setPaymentMethod("cash")}
                    >
                        <Text style={styles.methodIcon}>💵</Text>
                        <Text
                            style={[
                                styles.methodText,
                                paymentMethod === "cash" && styles.methodTextActive,
                            ]}
                        >
                            Cash
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* UPI Payment Form */}
                {paymentMethod === "upi" && (
                    <View style={styles.section}>
                        <View style={styles.qrCard}>
                            <Text style={styles.qrTitle}>Scan QR to Pay</Text>
                            <View style={styles.qrPlaceholder}>
                                <Text style={styles.qrIcon}>📲</Text>
                                <Text style={styles.qrUpi}>library@upi</Text>
                            </View>
                            <Text style={styles.qrNote}>
                                Pay ₹{rental.totalRent || 0} to the above UPI ID
                            </Text>
                        </View>

                        <InputField
                            label="UTR / Transaction Number"
                            placeholder="Enter 12-digit UTR number"
                            value={utrNumber}
                            onChangeText={setUtrNumber}
                        />

                        <Text style={styles.uploadLabel}>Payment Screenshot</Text>
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                            {screenshot ? (
                                <Image
                                    source={{ uri: screenshot }}
                                    style={styles.screenshotPreview}
                                />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Text style={styles.uploadIcon}>📷</Text>
                                    <Text style={styles.uploadText}>
                                        Tap to upload screenshot
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <Button
                            title="Submit Payment"
                            onPress={handleUpiPayment}
                            loading={uploading}
                            style={{ marginTop: Spacing.md }}
                        />
                    </View>
                )}

                {/* Cash Payment */}
                {paymentMethod === "cash" && (
                    <View style={styles.section}>
                        <View style={styles.cashCard}>
                            <Text style={styles.cashIcon}>💵</Text>
                            <Text style={styles.cashTitle}>Cash on Pickup</Text>
                            <Text style={styles.cashDesc}>
                                Pay ₹{rental.totalRent || 0} in cash when the book is picked
                                up. Our delivery agent will collect the amount.
                            </Text>
                        </View>

                        <Button
                            title="Confirm Cash Payment"
                            onPress={handleCashPayment}
                            loading={uploading}
                            style={{ marginTop: Spacing.md }}
                        />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
    scroll: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    backText: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: "600",
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: Colors.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
    },
    amountCard: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        padding: Spacing.lg,
        alignItems: "center",
        marginBottom: Spacing.lg,
    },
    amountLabel: {
        fontSize: 14,
        color: Colors.white,
        opacity: 0.9,
    },
    amountValue: {
        fontSize: 36,
        fontWeight: "800",
        color: Colors.white,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    methodRow: {
        flexDirection: "row",
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    methodCard: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: Spacing.md,
        alignItems: "center",
        borderWidth: 2,
        borderColor: Colors.border,
    },
    methodActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    methodIcon: {
        fontSize: 28,
        marginBottom: 4,
    },
    methodText: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.text,
    },
    methodTextActive: {
        color: Colors.primary,
    },
    section: {
        marginTop: Spacing.sm,
    },
    qrCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: Spacing.lg,
        alignItems: "center",
        marginBottom: Spacing.lg,
    },
    qrTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    qrPlaceholder: {
        width: 160,
        height: 160,
        backgroundColor: Colors.background,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.md,
    },
    qrIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    qrUpi: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.primary,
    },
    qrNote: {
        fontSize: 13,
        color: Colors.textSecondary,
        textAlign: "center",
    },
    uploadLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.text,
        marginBottom: Spacing.xs,
    },
    uploadBtn: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.border,
        borderStyle: "dashed",
        overflow: "hidden",
        minHeight: 120,
    },
    uploadPlaceholder: {
        padding: Spacing.lg,
        alignItems: "center",
        justifyContent: "center",
    },
    uploadIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    uploadText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    screenshotPreview: {
        width: "100%",
        height: 200,
        resizeMode: "cover",
    },
    cashCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: Spacing.lg,
        alignItems: "center",
    },
    cashIcon: {
        fontSize: 48,
        marginBottom: Spacing.sm,
    },
    cashTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    cashDesc: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: "center",
        lineHeight: 20,
    },
});
