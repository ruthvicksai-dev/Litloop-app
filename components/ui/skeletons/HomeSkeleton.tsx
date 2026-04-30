import { Layout, Spacing } from "@/constants/theme";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DiscoverBookCardSkeleton } from "./DiscoverBookCardSkeleton";
import { Skeleton } from "./Skeleton";

export const HomeSkeleton = () => {
    const renderSection = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View>
                    <Skeleton width={180} height={24} />
                    <Skeleton width={240} height={14} style={{ marginTop: 6 }} />
                </View>
                <Skeleton width={60} height={20} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
                {[1, 2, 3, 4].map((i) => (
                    <DiscoverBookCardSkeleton key={i} />
                ))}
            </ScrollView>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Skeleton width={100} height={16} style={{ marginBottom: 8 }} />
                    <Skeleton width={200} height={32} />
                </View>
                <Skeleton width={44} height={44} borderRadius={12} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {renderSection()}
                {renderSection()}
                {renderSection()}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    scroll: {
        paddingTop: Spacing.md,
    },
    section: {
        marginBottom: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Layout.screenPaddingWide,
        marginBottom: Spacing.sm,
    },
    list: {
        paddingLeft: Layout.screenPaddingWide,
    },
});
