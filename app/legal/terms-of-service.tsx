import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LAST_UPDATED = "March 24, 2026";
const CONTACT_EMAIL = "litloopbooks@gmail.com";
const APP_NAME = "Lit Loop";
const COMPANY = "Lit Loop";

interface SectionProps {
    title: string;
    children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle} allowFontScaling={false}>
                {title}
            </Text>
            {children}
        </View>
    );
}

function Para({ children }: { children: React.ReactNode }) {
    return (
        <Text style={styles.para} allowFontScaling={false}>
            {children}
        </Text>
    );
}

function Bullet({ text }: { text: string }) {
    return (
        <View style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText} allowFontScaling={false}>
                {text}
            </Text>
        </View>
    );
}

export default function TermsOfServiceScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="arrow-back" size={22} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>
                    Terms of Service
                </Text>
                <View style={styles.backBtn} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.lastUpdated} allowFontScaling={false}>
                    Last updated: {LAST_UPDATED}
                </Text>

                <Para>
                    Please read these Terms of Service ("Terms") carefully before using the {APP_NAME} app. By creating an account or renting a book, you agree to be bound by these Terms.
                </Para>

                <Section title="1. Acceptance of Terms">
                    <Para>
                        By accessing or using {APP_NAME}, you confirm that you are at least 13 years of age and agree to these Terms and our Privacy Policy. If you do not agree, please do not use the app.
                    </Para>
                </Section>

                <Section title="2. The Service">
                    <Para>
                        {APP_NAME} is a physical book rental service. We provide the platform and logistics to lend books to registered users for a period agreed at the time of rental. Books remain the property of {COMPANY} at all times.
                    </Para>
                </Section>

                <Section title="3. Accounts">
                    <Bullet text="You must provide accurate and complete information when creating your account." />
                    <Bullet text="You are responsible for maintaining the confidentiality of your account credentials." />
                    <Bullet text="You must not share your account with others or use another person's account." />
                    <Bullet text="We reserve the right to suspend or terminate accounts that violate these Terms." />
                </Section>

                <Section title="4. Rental Policy">
                    <Para>When you place a rental request:</Para>
                    <Bullet text="Requests are subject to book availability." />
                    <Bullet text="You must provide a valid delivery address within our service zones (Home or College)." />
                    <Bullet text="Delivery and pickup will be scheduled by our team at a mutually convenient time." />
                    <Bullet text="The rental period begins on the date the book is delivered to you." />
                    <Bullet text="Books must be returned in the same condition as received, with reasonable wear excepted." />
                    <Bullet text="Damage to or loss of a book may result in additional charges." />
                </Section>

                <Section title="5. Pricing and Payments">
                    <Para>
                        Rental pricing is displayed in the app as a per-day rate. Total rent is calculated based on the actual rental duration. All payments made through {APP_NAME} are for physical book rental services only — not for digital goods, in-app credits, or subscription services.
                    </Para>
                    <Bullet text="Payment is due at the time of pickup scheduling, before the book is collected." />
                    <Bullet text="We accept UPI (via QR code scan or deep link) and Cash (collected at pickup)." />
                    <Bullet text="UPI payments are NOT auto-confirmed. After scanning the QR and completing payment in your UPI app, you must enter your UTR (transaction reference ID) in the app for our team to verify." />
                    <Bullet text="Payment verification is completed within 24 hours of submission. You will receive an in-app notification when verified." />
                    <Bullet text="The QR code encodes the exact rental amount and order ID. Do not alter the payment amount when scanning." />
                    <Bullet text="All prices are listed in Indian Rupees (INR)." />
                </Section>

                <Section title="5a. Payment Failure and Refund Policy">
                    <Para>If your UPI payment is rejected:</Para>
                    <Bullet text="You will be notified via in-app notification and push notification." />
                    <Bullet text="Your rental status will return to 'pickup scheduled' so you can resubmit payment." />
                    <Bullet text="If you were charged by your bank but the payment was rejected by us (e.g. wrong UTR submitted), contact us at litloopbooks@gmail.com with proof of transaction. We will verify and resolve within 3 business days." />
                    <Bullet text="Refunds, if applicable, will be processed to the original payment method within 5–7 business days." />
                    <Bullet text="No refunds are issued for rentals already delivered and in your possession." />
                </Section>

                <Section title="6. Late Returns and Late Fees">
                    <Para>
                        If a book is returned after the originally agreed rental period, a late fee will be charged based on the per-day rate for each additional day. Late fees will be displayed in the app and are payable before the book is accepted back.
                    </Para>
                </Section>

                <Section title="7. Cancellations">
                    <Para>
                        You may cancel a rental request before your delivery is scheduled by contacting our support team. Once a delivery has been scheduled, cancellations are at the discretion of {COMPANY} and may incur a cancellation fee.
                    </Para>
                </Section>

                <Section title="8. User Conduct">
                    <Para>You agree not to:</Para>
                    <Bullet text="Use the app for any unlawful purpose." />
                    <Bullet text="Submit fraudulent, reused, or fabricated UTR numbers or payment screenshots." />
                    <Bullet text="Deliberately submit the same UTR number for multiple rental payments." />
                    <Bullet text="Alter the QR code amount or attempt to pay a different amount than shown." />
                    <Bullet text="Attempt to circumvent the rate limiting or security systems." />
                    <Bullet text="Interfere with the normal operation of the service." />
                    <Bullet text="Use another user's credentials to access the platform." />
                    <Para>Misuse of the payment system, including submission of fake UTR numbers or fraudulent screenshots, will result in immediate account suspension and may be reported to relevant authorities.</Para>
                </Section>

                <Section title="9. Intellectual Property">
                    <Para>
                        All content in the {APP_NAME} app, including but not limited to text, graphics, logos, and software code, is the property of {COMPANY} and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
                    </Para>
                </Section>

                <Section title="10. Disclaimer of Warranties">
                    <Para>
                        The service is provided "as is" and "as available" without warranties of any kind. We do not guarantee that the app will be uninterrupted, error-free, or free from viruses. We are not responsible for any damage to your device resulting from your use of the app.
                    </Para>
                </Section>

                <Section title="11. Limitation of Liability">
                    <Para>
                        To the maximum extent permitted by law, {COMPANY} shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the service. Our total liability to you for any claim shall not exceed the amount you paid us in the 30 days prior to the claim.
                    </Para>
                </Section>

                <Section title="12. Changes to Terms">
                    <Para>
                        We reserve the right to modify these Terms at any time. We will notify you of material changes via in-app notification or email. Your continued use of the app after the effective date of the updated Terms constitutes your acceptance.
                    </Para>
                </Section>

                <Section title="13. Governing Law">
                    <Para>
                        These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of the courts in India.
                    </Para>
                </Section>

                <Section title="14. Contact Us">
                    <Para>
                        If you have any questions about these Terms, please contact us:
                    </Para>
                    <Para>📧 {CONTACT_EMAIL}</Para>
                    <Para>🏢 {COMPANY}</Para>
                </Section>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.background,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    content: {
        padding: 20,
        paddingBottom: 60,
    },
    lastUpdated: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginBottom: Spacing.lg,
    },
    section: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.primary,
        marginBottom: Spacing.sm,
    },
    para: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        lineHeight: 22,
        marginBottom: Spacing.sm,
    },
    bulletRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 6,
        paddingLeft: 4,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
        marginTop: 8,
        marginRight: 10,
        flexShrink: 0,
    },
    bulletText: {
        flex: 1,
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        lineHeight: 22,
    },
});
