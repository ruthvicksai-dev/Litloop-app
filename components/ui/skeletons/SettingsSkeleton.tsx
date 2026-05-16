import { Skeleton } from "@/components/ui/skeletons/Skeleton";
import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";

/** A single skeleton row matching the settings row layout (icon + text + trailing). */
function SkeletonRow({ hasTrailing = false }: { hasTrailing?: boolean }) {
    return (
        <View style={styles.row}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <Skeleton width={120} height={14} borderRadius={6} />
            {hasTrailing && (
                <View style={styles.trailing}>
                    <Skeleton width={40} height={24} borderRadius={12} />
                </View>
            )}
        </View>
    );
}

/** Skeleton divider between rows. */
function SkeletonDivider() {
    return <View style={styles.divider} />;
}

/** A card section with N rows. */
function SkeletonSection({ rows, hasTrailing }: { rows: number; hasTrailing?: boolean }) {
    return (
        <View style={styles.section}>
            {Array.from({ length: rows }).map((_, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <SkeletonDivider />}
                    <SkeletonRow hasTrailing={hasTrailing} />
                </React.Fragment>
            ))}
        </View>
    );
}

/**
 * Loading skeleton for the settings page.
 * Mirrors the actual layout: section label + card with rows.
 */
export function SettingsSkeleton() {
    return (
        <View style={styles.container}>
            {/* Section label */}
            <Skeleton width={100} height={10} borderRadius={4} style={styles.label} />
            {/* Account section — 3 rows */}
            <SkeletonSection rows={3} />

            {/* Section label */}
            <Skeleton width={60} height={10} borderRadius={4} style={styles.label} />
            {/* Notifications — 1 row with toggle */}
            <SkeletonSection rows={1} hasTrailing />

            {/* Section label */}
            <Skeleton width={50} height={10} borderRadius={4} style={styles.label} />
            {/* Legal — 2 rows */}
            <SkeletonSection rows={2} />

            {/* Sign out button skeleton */}
            <Skeleton width="100%" height={50} borderRadius={16} style={styles.signOut} />
        </View>
    );
}

/**
 * Loading skeleton for admin settings with the UPI section at top.
 */
export function AdminSettingsSkeleton() {
    return (
        <View style={styles.container}>
            {/* Payment config label */}
            <Skeleton width={160} height={10} borderRadius={4} style={styles.label} />
            {/* UPI section — 2 rows */}
            <View style={styles.section}>
                <View style={styles.upiRow}>
                    <View style={{ flex: 1 }}>
                        <Skeleton width={180} height={14} borderRadius={6} />
                        <Skeleton width={80} height={10} borderRadius={4} style={{ marginTop: 6 }} />
                    </View>
                    <Skeleton width={70} height={28} borderRadius={8} />
                    <Skeleton width={32} height={32} borderRadius={8} />
                </View>
                <SkeletonDivider />
                <View style={styles.upiRow}>
                    <View style={{ flex: 1 }}>
                        <Skeleton width={200} height={14} borderRadius={6} />
                        <Skeleton width={60} height={10} borderRadius={4} style={{ marginTop: 6 }} />
                    </View>
                    <Skeleton width={70} height={28} borderRadius={8} />
                    <Skeleton width={32} height={32} borderRadius={8} />
                </View>
            </View>

            {/* General label */}
            <Skeleton width={60} height={10} borderRadius={4} style={styles.label} />
            <SkeletonSection rows={1} hasTrailing />

            {/* Legal label */}
            <Skeleton width={50} height={10} borderRadius={4} style={styles.label} />
            <SkeletonSection rows={2} />

            {/* Sign out */}
            <Skeleton width="100%" height={50} borderRadius={16} style={styles.signOut} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: Spacing.sm,
    },
    label: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
        marginLeft: 4,
    },
    section: {
        backgroundColor: Colors.surfaceCard,
        borderRadius: 16,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    trailing: {
        marginLeft: "auto",
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
        backgroundColor: Colors.border + "30",
    },
    upiRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
    },
    signOut: {
        marginTop: Spacing.lg,
    },
});
