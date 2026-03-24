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

const LAST_UPDATED = "March 24, 2025";
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

export default function PrivacyPolicyScreen() {
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
                    Privacy Policy
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
                    Welcome to {APP_NAME}. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile app.
                </Para>

                <Section title="1. Information We Collect">
                    <Para>We collect information you provide directly to us:</Para>
                    <Bullet text="Account information: your name, email address, and phone number." />
                    <Bullet text="Profile and authentication: password (stored as a secure hash), or Google OAuth tokens if you sign in with Google." />
                    <Bullet text="Delivery information: your delivery address, including location coordinates when you choose home delivery." />
                    <Bullet text="Payment information: UPI Transaction Reference (UTR) numbers and payment screenshots uploaded for verification. We do not store raw card or bank account numbers." />
                    <Bullet text="Rental history: books you have rented, rental status, and dates." />
                    <Bullet text="Communications: messages you send us via email." />

                    <Para>We also collect certain information automatically:</Para>
                    <Bullet text="Device push notification token (for sending you order and rental updates)." />
                    <Bullet text="IP address and basic device info (for rate limiting and fraud prevention)." />
                    <Bullet text="Usage analytics: general app interaction data to improve the service." />
                </Section>

                <Section title="2. How We Use Your Information">
                    <Para>We use the information we collect to:</Para>
                    <Bullet text="Create and manage your account." />
                    <Bullet text="Process book rental requests and coordinate delivery and pickup." />
                    <Bullet text="Verify payments and prevent fraudulent transactions." />
                    <Bullet text="Send you push notifications about your rental status, payments, and book availability." />
                    <Bullet text="Respond to your customer support enquiries." />
                    <Bullet text="Improve and personalise the app experience." />
                    <Bullet text="Comply with applicable legal obligations." />
                </Section>

                <Section title="3. Location Data">
                    <Para>
                        If you choose home delivery, we request access to your device location to help you set your delivery address accurately via Google Maps. We only use your location at the time of address selection and do not track your location in the background.
                    </Para>
                </Section>

                <Section title="4. How We Share Your Information">
                    <Para>
                        We do not sell, trade, or rent your personal information to third parties. We may share limited information with:
                    </Para>
                    <Bullet text="Google (for authentication via Google Sign-In and Maps services)." />
                    <Bullet text="Expo (for push notification delivery via Expo Push Notification service)." />
                    <Bullet text="Convex (our backend infrastructure provider), who processes data on our behalf under a data processing agreement." />
                    <Para>
                        All third-party providers are required to keep your data secure and confidential.
                    </Para>
                </Section>

                <Section title="5. Data Retention">
                    <Para>
                        We retain your account data for as long as your account is active. Rental records are retained for a minimum of 2 years for compliance purposes. You may request deletion of your personal data by contacting us.
                    </Para>
                </Section>

                <Section title="6. Data Security">
                    <Para>
                        We implement industry-standard security measures including:
                    </Para>
                    <Bullet text="Passwords are hashed using PBKDF2 with a unique salt and are never stored in plain text." />
                    <Bullet text="Authentication uses short-lived access tokens (JWT) and rotated refresh tokens." />
                    <Bullet text="All data is transmitted over HTTPS/TLS." />
                    <Para>
                        Despite our efforts, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
                    </Para>
                </Section>

                <Section title="7. Children's Privacy">
                    <Para>
                        {APP_NAME} is not intended for users under the age of 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such data, please contact us immediately.
                    </Para>
                </Section>

                <Section title="8. Your Rights">
                    <Para>You have the right to:</Para>
                    <Bullet text="Access the personal data we hold about you." />
                    <Bullet text="Correct inaccurate data." />
                    <Bullet text="Request deletion of your account and associated data." />
                    <Bullet text="Withdraw consent for push notifications at any time via your device settings." />
                    <Para>To exercise these rights, contact us at {CONTACT_EMAIL}.</Para>
                </Section>

                <Section title="9. Changes to This Policy">
                    <Para>
                        We may update this Privacy Policy from time to time. We will notify you of significant changes via in-app notification or email. Continued use of the app after changes constitutes your acceptance of the updated policy.
                    </Para>
                </Section>

                <Section title="10. Contact Us">
                    <Para>
                        If you have any questions or concerns about this Privacy Policy, please contact us:
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
