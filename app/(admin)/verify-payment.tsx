import StudentVerificationsList from "@/components/admin/verifications/StudentVerificationsList";
import AdminHeader from "@/components/admin/core/AdminHeader";
import BookLoader from "@/components/ui/feedback/BookLoader";
import { EmptyState } from "@/components/ui/feedback/EmptyState";
import { SegmentedControl, SegmentOption } from "@/components/ui/core/SegmentedControl";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { useVerifyPaymentScreen } from "@/hooks";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    Modal,
    Text,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import RejectReasonModal from "@/components/admin/verifications/RejectReasonModal";
import PaymentVerificationCard from "@/components/admin/verifications/PaymentVerificationCard";
import SinglePaymentVerificationView from "@/components/admin/verifications/SinglePaymentVerificationView";
import PaymentVerificationListHeader from "@/components/admin/verifications/PaymentVerificationListHeader";

const TAB_OPTIONS: SegmentOption[] = [
    { label: "Payments", value: "payments", icon: "cash-outline", activeIcon: "cash" },
    { label: "Students", value: "students", icon: "school-outline", activeIcon: "school" },
];

export default function VerifyPaymentScreen() {
    const [activeTab, setActiveTab] = React.useState("payments");
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
    const params = useLocalSearchParams<{ rentalId?: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = React.useState(false);
    const { pendingPayments, singleRental, handleVerify } = useVerifyPaymentScreen(
        params.rentalId
    );

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    // Rejection reason state
    const [rejectModalVisible, setRejectModalVisible] = React.useState(false);
    const [rejectTargetId, setRejectTargetId] = React.useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = React.useState("");
    const [rejecting, setRejecting] = React.useState(false);

    const openRejectModal = (targetId: string) => {
        setRejectTargetId(targetId);
        setRejectionReason("");
        setRejectModalVisible(true);
    };

    const confirmReject = async () => {
        if (!rejectTargetId) return;
        setRejecting(true);
        await handleVerify(rejectTargetId, false, rejectionReason);
        setRejecting(false);
        setRejectModalVisible(false);
        setRejectTargetId(null);
    };

    if ((params.rentalId && singleRental === undefined) || pendingPayments === undefined) {
        return (
            <View style={styles.center}>
                <BookLoader label="Loading payments..." />
            </View>
        );
    }

    if (params.rentalId && !singleRental) {
        return (
            <SafeAreaView style={styles.container}>
                <AdminHeader title="Verify Payment" />
                <Text style={styles.screenSubtitle}>This payment request is no longer available.</Text>
                <EmptyState
                    icon="receipt-outline"
                    title="Payment request not found"
                    subtitle="It may have already been verified or removed from the queue."
                    actionLabel="Go Back"
                    onAction={() => router.back()}
                />
            </SafeAreaView>
        );
    }

    if (params.rentalId && singleRental) {
        return (
            <SafeAreaView style={styles.container}>
                <AdminHeader title="Verify Payment" />
                <ScrollView
                    contentContainerStyle={[styles.singleScroll, { paddingBottom: Math.max(100, 60 + insets.bottom) }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primary]}
                        />
                    }
                >
                    <SinglePaymentVerificationView 
                        singleRental={singleRental}
                        handleVerify={handleVerify}
                        openRejectModal={openRejectModal}
                        setSelectedImage={setSelectedImage}
                    />
                </ScrollView>

                <RejectReasonModal
                    visible={rejectModalVisible}
                    reason={rejectionReason}
                    setReason={setRejectionReason}
                    loading={rejecting}
                    onConfirm={confirmReject}
                    onCancel={() => setRejectModalVisible(false)}
                />
            </SafeAreaView>
        );
    }

    const screenshotCount = pendingPayments.filter((item) => !!item.screenshotUrl).length;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.listHeaderWrap}>
                <AdminHeader title="Verifications" />
                
                <View style={{ paddingBottom: Spacing.sm }}>
                    <SegmentedControl
                        options={TAB_OPTIONS}
                        activeValue={activeTab}
                        onChange={(val) => setActiveTab(val)}
                    />
                </View>
            </View>

            {activeTab === "payments" && (
                <FlatList
                    data={pendingPayments}
                    keyExtractor={(item) => item._id}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primary]}
                        />
                    }
                    renderItem={({ item }) => (
                        <PaymentVerificationCard 
                            item={item}
                            handleVerify={handleVerify}
                            openRejectModal={openRejectModal}
                            setSelectedImage={setSelectedImage}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <PaymentVerificationListHeader 
                            pendingCount={pendingPayments.length}
                            screenshotCount={screenshotCount}
                        />
                    }
                    ListEmptyComponent={
                        <EmptyState 
                            icon="checkmark-circle-outline"
                            title="All payments are cleared"
                            subtitle="There are no pending payment proofs waiting for admin verification."
                        />
                    }
                />
            )}

            {activeTab === "students" && (
                <View style={{ flex: 1 }}>
                    <StudentVerificationsList />
                </View>
            )}

            <RejectReasonModal
                visible={rejectModalVisible}
                reason={rejectionReason}
                setReason={setRejectionReason}
                loading={rejecting}
                onConfirm={confirmReject}
                onCancel={() => setRejectModalVisible(false)}
            />

            {/* Image Viewer Modal */}
            <Modal visible={!!selectedImage} transparent={true} animationType="fade" onRequestClose={() => setSelectedImage(null)}>
                <View style={styles.imageViewerOverlay}>
                    <TouchableOpacity 
                        style={styles.imageViewerClose}
                        onPress={() => setSelectedImage(null)}
                    >
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                    {selectedImage && (
                        <Image 
                            source={{ uri: selectedImage }} 
                            style={styles.imageViewerImage} 
                            resizeMode="contain" 
                        />
                    )}
                </View>
            </Modal>
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
    singleScroll: {
        paddingHorizontal: Layout.screenPaddingWide,
    },
    screenSubtitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        textAlign: "center",
        paddingHorizontal: Spacing.xl,
        marginTop: Spacing.sm,
    },
    listHeaderWrap: {
        // No extra padding here, relying on AdminHeader and inner component padding
    },
    list: {
        flexGrow: 1,
        paddingHorizontal: Layout.screenPaddingWide,
        paddingBottom: Spacing.xl,
    },
    imageViewerOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.9)",
        justifyContent: "center",
        alignItems: "center",
    },
    imageViewerClose: {
        position: "absolute",
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 24,
    },
    imageViewerImage: {
        width: "100%",
        height: "80%",
    },
});
