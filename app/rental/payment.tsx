import BookLoader from "@/components/ui/feedback/BookLoader";
import Button from "@/components/ui/core/Button";
import ConfirmActionModal from "@/components/ui/feedback/ConfirmActionModal";
import InputField from "@/components/ui/core/InputField";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, scale, Spacing } from "@/constants/theme";
import { useToast } from "@/context/ToastContext";
import { usePaymentScreen } from "@/hooks";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { buildUpiUri, UPI_ID_FALLBACK, PAYEE_NAME_FALLBACK } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentScreen() {
    const { rentalId } = useLocalSearchParams<{ rentalId: string }>();
    const router = useRouter();
    const {
        rental,
        paymentSettings,
        utrNumber,
        setUtrNumber,
        screenshot,
        uploading,
        paymentMethod,
        setPaymentMethod,
        pickImage,
        handleUpiPayment,
        handleCashPayment,
        canceling,
        handleCancelPickup,
    } = usePaymentScreen(rentalId);

    // Resolve dynamic config from backend, with env-var fallbacks
    const upiId = paymentSettings?.upiId ?? UPI_ID_FALLBACK;
    const merchantName = paymentSettings?.merchantName ?? PAYEE_NAME_FALLBACK;
    const upiOnHold = paymentSettings === null;

    const { isOnline } = useNetworkStatus();
    const { showToast } = useToast();

    const [isCancelModalVisible, setCancelModalVisible] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!rental?.paymentExpiresAt) return;

        const updateTimer = () => {
            const now = Date.now();
            const diff = rental.paymentExpiresAt! - now;

            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft("Expired");
                return false;
            } else {
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
                return true;
            }
        };

        if (updateTimer()) {
            const interval = setInterval(() => {
                if (!updateTimer()) {
                    clearInterval(interval);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [rental?.paymentExpiresAt]);

    const onSubmitUpiPayment = () => {
        if (!isOnline) {
            showToast("Internet is required to submit payment.", "error");
            return;
        }
        handleUpiPayment();
    };

    const onSubmitCashPayment = () => {
        if (!isOnline) {
            showToast("Internet is required to submit payment.", "error");
            return;
        }
        handleCashPayment();
    };

    const onCancelPickupPress = () => {
        if (!isOnline) {
            showToast("Internet is required to cancel pickup.", "error");
            return;
        }
        setCancelModalVisible(true);
    };

    if (!rental) {
        return (
            <View style={styles.center}>
                <BookLoader label="Loading payment..." />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                        >
                            <Ionicons name="chevron-back" size={24} color={Colors.text} />
                        </TouchableOpacity>
                        <View style={styles.headerText}>
                            <Text style={styles.title}>Payment</Text>
                            <Text style={styles.subtitle}>{rental.book?.title}</Text>
                        </View>
                    </View>

                    <View style={styles.amountCard}>
                        <Text style={styles.amountLabel}>Total Amount</Text>
                        <Text style={styles.amountValue}>₹ {rental.totalRent || 0}</Text>
                    </View>

                    {timeLeft ? (
                        <View style={[styles.timerContainer, isExpired && styles.timerExpired]}>
                            <Ionicons name="time-outline" size={20} color={isExpired ? Colors.error : Colors.warning} />
                            <Text style={[styles.timerText, isExpired && styles.timerTextExpired]}>
                                {isExpired ? "Payment time expired" : `Time left to pay: ${timeLeft}`}
                            </Text>
                        </View>
                    ) : null}

                    <View style={styles.noteContainer}>
                        <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
                        <Text style={styles.noteText}>
                            Note: Please complete your payment within 1 hour of scheduling. If not completed, your pickup will be automatically cancelled.
                        </Text>
                    </View>

                    <Button
                        title="Cancel Pickup & Resume Timer"
                        onPress={onCancelPickupPress}
                        variant="outline"
                        style={{ marginHorizontal: Spacing.md, marginBottom: Spacing.md, borderColor: Colors.error }}
                        textStyle={{ color: Colors.error }}
                        loading={canceling}
                        disabled={!isOnline || isExpired}
                    />

                    <Text style={styles.sectionTitle}>Choose Payment Method</Text>
                    <View style={styles.methodRow}>
                        <TouchableOpacity
                            style={[
                                styles.methodCard,
                                paymentMethod === "upi" && styles.methodActive,
                                upiOnHold && { opacity: 0.45 },
                            ]}
                            onPress={() => {
                                if (upiOnHold) {
                                    showToast("UPI payments are currently on hold. Please use Cash.", "info");
                                    return;
                                }
                                setPaymentMethod("upi");
                            }}
                            disabled={upiOnHold}
                        >
                            <View
                                style={[
                                    styles.methodIconWrap,
                                    paymentMethod === "upi" && styles.methodIconWrapActive,
                                ]}
                            >
                                <Ionicons
                                    name="phone-portrait-outline"
                                    size={22}
                                    color={paymentMethod === "upi" ? Colors.white : Colors.primary}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.methodText,
                                    paymentMethod === "upi" && styles.methodTextActive,
                                ]}
                            >
                                UPI
                            </Text>
                            {upiOnHold && (
                                <Text style={styles.onHoldLabel}>On Hold</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.methodCard,
                                paymentMethod === "cash" && styles.methodActive,
                            ]}
                            onPress={() => setPaymentMethod("cash")}
                        >
                            <View
                                style={[
                                    styles.methodIconWrap,
                                    paymentMethod === "cash" && styles.methodIconWrapActive,
                                ]}
                            >
                                <Ionicons
                                    name="cash-outline"
                                    size={22}
                                    color={paymentMethod === "cash" ? Colors.white : Colors.primary}
                                />
                            </View>
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

                    {paymentMethod === "upi" ? (
                        <View style={styles.section}>
                            <View style={styles.qrCard}>
                                <Text style={styles.qrTitle}>Scan QR to Pay</Text>

                                {/* Real UPI QR — amount bound to this specific order */}
                                <View style={styles.qrWrapper}>
                                    <QRCode
                                        value={buildUpiUri(
                                            rental.totalRent ?? 0,
                                            typeof rentalId === "string" ? rentalId : "",
                                            upiId,
                                            merchantName
                                        )}
                                        size={scale(180)}
                                        color={Colors.text}
                                        backgroundColor="#FFFFFF"
                                        quietZone={12}
                                    />
                                </View>

                                <Text style={styles.qrUpiId}>{upiId}</Text>
                                <Text style={styles.qrNote}>
                                    Pay ₹{rental.totalRent ?? 0} using any UPI app
                                </Text>

                                {/* UPI deep link — opens phone's UPI app directly */}
                                <TouchableOpacity
                                    style={styles.openUpiBtn}
                                    onPress={() =>
                                        Linking.openURL(
                                            buildUpiUri(
                                                rental.totalRent ?? 0,
                                                typeof rentalId === "string" ? rentalId : "",
                                                upiId,
                                                merchantName
                                            )
                                        ).catch(() => { })
                                    }
                                >
                                    <Ionicons name="phone-portrait-outline" size={scale(16)} color={Colors.primary} />
                                    <Text style={styles.openUpiText}>Open in UPI App</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Compliance: no misleading instant success message */}
                            <View style={styles.disclaimer}>
                                <Ionicons name="information-circle-outline" size={scale(16)} color="#D97706" />
                                <Text style={styles.disclaimerText}>
                                    Payment will be verified by the Lit Loop team before your order is confirmed.
                                    Do not close the app until you have submitted your UTR number.
                                </Text>
                            </View>

                            <InputField
                                label="UTR / Transaction Number"
                                placeholder="Enter 12–22 character UTR number"
                                value={utrNumber}
                                onChangeText={setUtrNumber}
                                autoCapitalize="characters"
                                maxLength={22}
                            />

                            <Text style={styles.uploadLabel}>Payment Screenshot (Optional)</Text>
                            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                                {screenshot ? (
                                    <Image source={{ uri: screenshot }} style={styles.screenshotPreview} />
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <Ionicons name="image-outline" size={scale(32)} color={Colors.primary} />
                                        <Text style={styles.uploadText}>Tap to upload screenshot</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <Button
                                title="Submit Payment"
                                onPress={onSubmitUpiPayment}
                                loading={uploading}
                                disabled={!isOnline || isExpired}
                                style={{ marginTop: Spacing.md }}
                            />
                        </View>
                    ) : null}

                    {paymentMethod === "cash" ? (
                        <View style={styles.section}>
                            <View style={styles.cashCard}>
                                <Ionicons name="cash-outline" size={scale(40)} color={Colors.primary} style={{ marginBottom: Spacing.sm }} />
                                <Text style={styles.cashTitle}>Cash on Pickup</Text>
                                <Text style={styles.cashDesc}>
                                    Pay ₹{rental.totalRent || 0} in cash when the book is picked up. Our
                                    delivery agent will collect the amount.
                                </Text>
                            </View>

                            {/* Compliance: no misleading instant success message */}
                            <View style={styles.disclaimer}>
                                <Ionicons name="information-circle-outline" size={scale(16)} color="#D97706" />
                                <Text style={styles.disclaimerText}>
                                    Cash payment will be confirmed by the delivery agent on arrival.
                                </Text>
                            </View>

                            <Button
                                title="Confirm Cash Payment"
                                onPress={onSubmitCashPayment}
                                loading={uploading}
                                disabled={!isOnline || isExpired}
                                style={{ marginTop: Spacing.md, backgroundColor: "#10B981" }}
                            />
                        </View>
                    ) : null}
                </ScrollView>
            </KeyboardAvoidingView>

            <ConfirmActionModal
                visible={isCancelModalVisible}
                title="Cancel Pickup?"
                message="Are you sure you want to cancel the scheduled pickup? Your rental timer will resume."
                confirmLabel="Yes, Cancel"
                cancelLabel="No"
                tone="danger"
                loading={canceling}
                onConfirm={() => {
                    setCancelModalVisible(false);
                    handleCancelPickup();
                }}
                onCancel={() => setCancelModalVisible(false)}
            />
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
    flex: {
        flex: 1,
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl * 1.5,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    backButton: {
        alignSelf: "flex-start",
        padding: 4,
        marginLeft: -4,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: FontSizes.heading,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    subtitle: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        marginTop: 2,
        fontFamily: Fonts.regular,
    },
    timerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.warning + "1A",
        padding: Spacing.sm,
        marginHorizontal: Spacing.md,
        borderRadius: 8,
        marginBottom: Spacing.md,
        gap: Spacing.xs,
    },
    timerExpired: {
        backgroundColor: Colors.error + "1A",
    },
    timerText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.warning,
    },
    timerTextExpired: {
        color: Colors.error,
    },
    noteContainer: {
        flexDirection: "row",
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        gap: Spacing.xs,
    },
    noteText: {
        flex: 1,
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        lineHeight: 18,
    },
    amountCard: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        padding: Spacing.lg,
        alignItems: "center",
        marginBottom: Spacing.lg,
    },
    amountLabel: {
        fontSize: FontSizes.body,
        color: Colors.white,
        opacity: 0.9,
        fontFamily: Fonts.bold,
    },
    amountValue: {
        fontSize: FontSizes.display,
        color: Colors.white,
        fontFamily: Fonts.bold,
    },
    sectionTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    methodRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    methodCard: {
        flex: 1,
        minWidth: 140,
        backgroundColor: Colors.surfaceCard,
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
    methodIconWrap: {
        width: 44,
        aspectRatio: 1,
        borderRadius: 22,
        marginBottom: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.primaryLight,
    },
    methodIconWrapActive: {
        backgroundColor: Colors.primary,
    },
    methodText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    methodTextActive: {
        color: Colors.primary,
    },
    section: {
        marginTop: Spacing.sm,
    },
    // QR
    qrCard: {
        backgroundColor: Colors.surfaceCard,
        borderRadius: 16,
        padding: Spacing.lg,
        alignItems: "center",
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    qrTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    qrWrapper: {
        padding: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    qrUpiId: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.primary,
        marginBottom: 4,
    },
    qrNote: {
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        textAlign: "center",
        fontFamily: Fonts.regular,
        marginBottom: Spacing.md,
    },
    openUpiBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    openUpiText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    // Compliance disclaimer
    disclaimer: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        backgroundColor: "#FFFBEB",
        borderColor: "#F59E0B",
        borderWidth: 1,
        borderRadius: 10,
        padding: Spacing.sm,
        marginBottom: Spacing.md,
    },
    disclaimerText: {
        flex: 1,
        fontSize: FontSizes.small,
        fontFamily: Fonts.regular,
        color: "#92400E",
        lineHeight: 18,
    },
    uploadLabel: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
        marginBottom: Spacing.xs,
    },
    uploadBtn: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.border,
        borderStyle: "dashed",
        overflow: "hidden",
        minHeight: 110,
    },
    uploadPlaceholder: {
        padding: Spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.xs,
    },
    uploadText: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
    screenshotPreview: {
        width: "100%",
        aspectRatio: 1.35,
        resizeMode: "cover",
    },
    cashCard: {
        backgroundColor: Colors.surfaceCard,
        borderRadius: 16,
        padding: Spacing.lg,
        alignItems: "center",
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.md,
    },
    cashTitle: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    cashDesc: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        textAlign: "center",
        lineHeight: 20,
        fontFamily: Fonts.regular,
    },
    onHoldLabel: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
        color: Colors.error,
        marginTop: 2,
    },
});
