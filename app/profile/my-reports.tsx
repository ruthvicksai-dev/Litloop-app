import { EmptyState } from "@/components/ui/feedback/EmptyState";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { useMyBugReports } from "@/hooks";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    FlatList,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Status badge configuration ──────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    open: { label: "Open", color: "#F59E0B", icon: "ellipse" },
    investigating: { label: "Investigating", color: "#3B82F6", icon: "search" },
    in_progress: { label: "In Progress", color: "#8B5CF6", icon: "code-slash" },
    fixed: { label: "Fixed", color: "#22C55E", icon: "checkmark-circle" },
    closed: { label: "Closed", color: "#6B7280", icon: "close-circle" },
    rejected: { label: "Rejected", color: "#EF4444", icon: "remove-circle" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    low: { label: "Low", color: "#6B7280" },
    medium: { label: "Medium", color: "#F59E0B" },
    high: { label: "High", color: "#F97316" },
    critical: { label: "Critical", color: "#EF4444" },
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface BugReportItem {
    _id: string;
    reportId: string;
    title: string;
    category: string;
    status: string;
    priority: string;
    githubIssueNumber?: number;
    githubIssueUrl?: string;
    createdAt: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MyReportsScreen() {
    const router = useRouter();
    const { reports } = useMyBugReports();

    const isLoading = reports === undefined;

    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const renderItem = ({ item }: { item: BugReportItem }) => {
        const statusConfig = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.open;
        const priorityConfig = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.low;

        return (
            <View style={styles.card}>
                {/* Header Row: ID + Status */}
                <View style={styles.cardHeader}>
                    <Text style={styles.reportId}>{item.reportId}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + "18" }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                            {statusConfig.label}
                        </Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                </Text>

                {/* Meta Row */}
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="folder-outline" size={13} color={Colors.textLight} />
                        <Text style={styles.metaText}>{item.category}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="flag-outline" size={13} color={priorityConfig.color} />
                        <Text style={[styles.metaText, { color: priorityConfig.color }]}>
                            {priorityConfig.label}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={13} color={Colors.textLight} />
                        <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
                    </View>
                </View>

                {/* GitHub Issue Link */}
                {item.githubIssueNumber ? (
                    <TouchableOpacity
                        style={styles.githubRow}
                        onPress={() => {
                            triggerHaptic("light");
                            if (item.githubIssueUrl) {
                                Linking.openURL(item.githubIssueUrl).catch(() => {});
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="logo-github" size={14} color={Colors.primary} />
                        <Text style={styles.githubText}>
                            Issue #{item.githubIssueNumber}
                        </Text>
                        <Ionicons name="open-outline" size={12} color={Colors.textLight} />
                    </TouchableOpacity>
                ) : null}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>
                    My Reports
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Content */}
            {isLoading ? (
                <View style={styles.loadingCenter}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : reports.length === 0 ? (
                <View style={styles.emptyCenter}>
                    <EmptyState
                        icon="document-text-outline"
                        title="No Reports Yet"
                        subtitle="Bug reports you submit will appear here. Tap below to report your first bug."
                    />
                    <Button
                        title="Report a Bug"
                        onPress={() => {
                            triggerHaptic("light");
                            router.push("/profile/report-bug");
                        }}
                    />
                </View>
            ) : (
                <FlatList
                    data={reports as BugReportItem[]}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                />
            )}
        </SafeAreaView>
    );
}

// ─── Inline Button for Empty State ───────────────────────────────────────────

function Button({
    title,
    onPress,
}: {
    title: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.emptyButton} onPress={onPress} activeOpacity={0.7}>
            <Ionicons name="bug-outline" size={18} color={Colors.white} />
            <Text style={styles.emptyButtonText}>{title}</Text>
        </TouchableOpacity>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
    loadingCenter: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyCenter: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 30,
        gap: Spacing.lg,
    },
    emptyButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        paddingHorizontal: Spacing.lg,
        borderRadius: Layout.borderRadius,
        gap: Spacing.sm,
    },
    emptyButtonText: {
        color: Colors.white,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.subtitle,
    },
    listContent: {
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xl,
    },

    // Card
    card: {
        backgroundColor: Colors.surfaceCard,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
        gap: Spacing.sm,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    reportId: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.primary,
        letterSpacing: 0.5,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 5,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
        textTransform: "uppercase",
        letterSpacing: 0.3,
    },
    cardTitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
        lineHeight: 20,
    },
    metaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.md,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    metaText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textLight,
    },
    githubRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: `${Colors.primary}08`,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: "flex-start",
    },
    githubText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.primary,
    },
});
