import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { useToast } from "@/context/ToastContext";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUPPORT_EMAIL = "support@litloop.in";
const SUPPORT_PHONE_DISPLAY = "+91 91827 55664";
const SUPPORT_PHONE_LINK = "tel:+919182755664";
const FAQ_URL = "https://litloop.in/faq";
const CONTACT_URL = "https://litloop.in/contact";

export default function SupportScreen() {
    const router = useRouter();
    const { showToast } = useToast();

    const openExternalLink = async (url: string, errorMessage: string) => {
        triggerHaptic("light");
        try {
            const supported = await Linking.canOpenURL(url);
            if (!supported) {
                showToast(errorMessage, "error");
                return;
            }
            await Linking.openURL(url);
        } catch {
            showToast(errorMessage, "error");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>
                    Contact Us
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.introBlock}>
                    <Text style={styles.introTitle}>Need a hand?</Text>
                    <Text style={styles.introText}>
                        Browse FAQs on our website, contact our team online, or reach us directly by
                        email or phone.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle} allowFontScaling={false}>
                        Website
                    </Text>
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() =>
                            openExternalLink(FAQ_URL, "Couldn't open FAQs page.")
                        }
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: `${Colors.primary}15` },
                            ]}
                        >
                            <Ionicons name="help-circle-outline" size={18} color={Colors.primary} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={styles.rowText} allowFontScaling={false}>
                                FAQs
                            </Text>
                            <Text style={styles.rowSubtext} allowFontScaling={false}>
                                Find quick answers on website
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={Colors.textLight}
                            style={styles.rowChevron}
                        />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() =>
                            openExternalLink(CONTACT_URL, "Couldn't open contact page.")
                        }
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: `${Colors.primaryDark}15` },
                            ]}
                        >
                            <Ionicons name="globe-outline" size={18} color={Colors.primaryDark} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={styles.rowText} allowFontScaling={false}>
                                Contact Page
                            </Text>
                            <Text style={styles.rowSubtext} allowFontScaling={false}>
                                Visit our website contact form
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={Colors.textLight}
                            style={styles.rowChevron}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle} allowFontScaling={false}>
                        Direct Support
                    </Text>
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() =>
                            openExternalLink(`mailto:${SUPPORT_EMAIL}`, "Couldn't open mail app.")
                        }
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: `${Colors.primary}15` },
                            ]}
                        >
                            <Ionicons name="mail-outline" size={18} color={Colors.primary} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={styles.rowText} allowFontScaling={false}>
                                Email Support
                            </Text>
                            <Text style={styles.rowSubtext} allowFontScaling={false}>
                                {SUPPORT_EMAIL}
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={Colors.textLight}
                            style={styles.rowChevron}
                        />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() =>
                            openExternalLink(SUPPORT_PHONE_LINK, "Couldn't open dialer.")
                        }
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: `${Colors.primaryDark}15` },
                            ]}
                        >
                            <Ionicons name="call-outline" size={18} color={Colors.primaryDark} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text style={styles.rowText} allowFontScaling={false}>
                                Call Support
                            </Text>
                            <Text style={styles.rowSubtext} allowFontScaling={false}>
                                {SUPPORT_PHONE_DISPLAY}
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={Colors.textLight}
                            style={styles.rowChevron}
                        />
                    </TouchableOpacity>
                </View>
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
        paddingHorizontal: Layout.screenPaddingWide,
        paddingVertical: Spacing.sm,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: FontSizes.title,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xl * 2,
    },
    introBlock: {
        marginBottom: Spacing.xl,
    },
    introTitle: {
        fontSize: FontSizes.titleLarge,
        color: Colors.text,
        fontFamily: Fonts.bold,
        marginBottom: Spacing.xs,
    },
    introText: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        lineHeight: 22,
    },
    section: {
        marginBottom: Spacing.xl,
        backgroundColor: Colors.surfaceCard,
        borderRadius: 16,
        paddingVertical: Spacing.xs,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
    },
    sectionTitle: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        paddingHorizontal: 16,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.xs,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    rowContent: {
        flex: 1,
    },
    rowText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    rowSubtext: {
        marginTop: 2,
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
    },
    rowChevron: {
        marginLeft: "auto",
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
        backgroundColor: Colors.border + "60",
    },
});
