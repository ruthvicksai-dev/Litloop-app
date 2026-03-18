import BookLoader from "@/components/ui/BookLoader";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { usePaymentScreen } from "@/hooks";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts, FontSizes } from "@/constants/fonts";

export default function PaymentScreen() {
    const { rentalId } = useLocalSearchParams<{ rentalId: string }>();
    const router = useRouter();
    const {
        rental,
        utrNumber,
        setUtrNumber,
        screenshot,
        uploading,
        paymentMethod,
        setPaymentMethod,
        pickImage,
        handleUpiPayment,
        handleCashPayment,
    } = usePaymentScreen(rentalId);

    if (!rental) {
        return (
            <View style={styles.center}>
                <BookLoader label="Loading payment..." />
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
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Payment</Text>
                <Text style={styles.subtitle}>{rental.book?.title}</Text>

                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Total Amount</Text>
                    <Text style={styles.amountValue}>₹{rental.totalRent || 0}</Text>
                </View>

                <Text style={styles.sectionTitle}>Choose Payment Method</Text>
                <View style={styles.methodRow}>
                    <TouchableOpacity
                        style={[
                            styles.methodCard,
                            paymentMethod === "upi" && styles.methodActive,
                        ]}
                        onPress={() => setPaymentMethod("upi")}
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
                            <View style={styles.qrPlaceholder}>
                                <Text style={styles.qrIcon}>QR</Text>
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
                                <Image source={{ uri: screenshot }} style={styles.screenshotPreview} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Text style={styles.uploadIcon}>IMG</Text>
                                    <Text style={styles.uploadText}>Tap to upload screenshot</Text>
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
                ) : null}

                {paymentMethod === "cash" ? (
                    <View style={styles.section}>
                        <View style={styles.cashCard}>
                            <Text style={styles.cashIcon}>Cash</Text>
                            <Text style={styles.cashTitle}>Cash on Pickup</Text>
                            <Text style={styles.cashDesc}>
                                Pay ₹{rental.totalRent || 0} in cash when the book is picked up. Our
                                delivery agent will collect the amount.
                            </Text>
                        </View>

                        <Button
                            title="Confirm Cash Payment"
                            onPress={handleCashPayment}
                            loading={uploading}
                            style={{ marginTop: Spacing.md }}
                        />
                    </View>
                ) : null}
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
        fontSize: FontSizes.subtitle,
        color: Colors.primary,
        fontFamily: Fonts.medium,
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: FontSizes.heading,
        color: Colors.text,
        marginBottom: 4,
        fontFamily: Fonts.bold,
    },
    subtitle: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
        fontFamily: Fonts.regular,
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
    qrCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: Spacing.lg,
        alignItems: "center",
        marginBottom: Spacing.lg,
    },
    qrTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
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
        fontSize: FontSizes.display,
        fontFamily: Fonts.bold,
        marginBottom: 8,
        color: Colors.primary,
    },
    qrUpi: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.primary,
    },
    qrNote: {
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        textAlign: "center",
        fontFamily: Fonts.regular,
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
        minHeight: 120,
    },
    uploadPlaceholder: {
        padding: Spacing.lg,
        alignItems: "center",
        justifyContent: "center",
    },
    uploadIcon: {
        fontSize: FontSizes.heading,
        fontFamily: Fonts.bold,
        marginBottom: 8,
        color: Colors.primary,
    },
    uploadText: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
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
        fontSize: FontSizes.heading,
        fontFamily: Fonts.bold,
        marginBottom: Spacing.sm,
        color: Colors.primary,
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
});
