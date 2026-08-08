import RentalActionButtons from "@/components/admin/rentals/detail/RentalActionButtons";
import RentalBookCard from "@/components/admin/rentals/detail/RentalBookCard";
import RentalCustomerCard from "@/components/admin/rentals/detail/RentalCustomerCard";
import RentalLocationCard from "@/components/admin/rentals/detail/RentalLocationCard";
import RentalPaymentCard from "@/components/admin/rentals/detail/RentalPaymentCard";
import RentalStatusBanner from "@/components/admin/rentals/detail/RentalStatusBanner";
import RentalTimelineStepper from "@/components/admin/rentals/detail/RentalTimelineStepper";
import Button from "@/components/ui/core/Button";
import BookLoader from "@/components/ui/feedback/BookLoader";
import ConfirmActionModal from "@/components/ui/feedback/ConfirmActionModal";
import { FontSizes, Fonts } from "@/constants/fonts";
import {
    Colors,
    Layout,
    RENTAL_STATUS_LABELS,
    STATUS_COLORS,
    Spacing,
    scale,
} from "@/constants/theme";
import { useAuthState } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function AdminRentalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuthState();
  const rental = useQuery(
    api.rentals.getRental,
    accessToken ? { accessToken, rentalId: id as Id<"rentals"> } : "skip",
  );
  const markDelivered = useMutation(api.rentals.markDelivered);
  const markReturned = useMutation(api.rentals.markReturned);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionModal, setActionModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    action: () => Promise<any>;
  }>({
    visible: false,
    title: "",
    message: "",
    action: async () => {},
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    triggerHaptic("light");
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (rental === undefined) {
    return (
      <SafeAreaView style={styles.center} edges={["bottom", "left", "right"]}>
        <BookLoader label="Fetching order details..." />
      </SafeAreaView>
    );
  }

  if (!rental) {
    return (
      <SafeAreaView style={styles.center} edges={["bottom", "left", "right"]}>
        <Text style={styles.errorText}>Order not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={{ marginTop: 20 }}
        />
      </SafeAreaView>
    );
  }

  const coverUri = rental.coverUrl || rental.coverUrls?.[0] || null;

  const handleAction = async (
    title: string,
    message: string,
    action: () => Promise<any>,
  ) => {
    triggerHaptic("medium");
    setActionModal({
      visible: true,
      title,
      message,
      action,
    });
  };

  const executeAction = async () => {
    setLoading(true);
    try {
      await actionModal.action();
      setActionModal((prev) => ({ ...prev, visible: false }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Action failed. Please try again.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const STATUS_FLOW = [
    "requested",
    "delivery_scheduled",
    "delivered",
    "payment_pending",
    "paid",
    "returned",
  ];
  const currentIndex = STATUS_FLOW.indexOf(rental.status);
  const statusColor =
    STATUS_COLORS[rental.status as keyof typeof STATUS_COLORS] ||
    Colors.textSecondary;
  const statusLabel =
    RENTAL_STATUS_LABELS[rental.status as keyof typeof RENTAL_STATUS_LABELS] ||
    rental.status;

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <StatusBar style="light" animated />

      {/* ─── Premium Gradient Hero Header ─── */}
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroHeader}
      >
        <View style={styles.heroDecor} pointerEvents="none">
          <View style={styles.heroDecorShape1} />
          <View style={styles.heroDecorShape2} />
        </View>

        <SafeAreaView edges={["top"]} style={styles.heroSafeArea}>
          <View style={styles.heroContent}>
            {/* Top Nav Row */}
            <View style={styles.topNavRow}>
              <TouchableOpacity
                style={styles.backBtn}
                activeOpacity={0.7}
                onPress={() => {
                  triggerHaptic("light");
                  router.back();
                }}
              >
                <Ionicons name="chevron-back" size={22} color={Colors.white} />
              </TouchableOpacity>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColor + "30" },
                ]}
              >
                <View
                  style={[styles.statusDot, { backgroundColor: statusColor }]}
                />
                <Text style={styles.statusBadgeText}>{statusLabel}</Text>
              </View>
            </View>

            {/* Title & Customer Subtitle */}
            <Text style={styles.heroTitle}>Order Details</Text>
            <Text style={styles.heroSubtitle}>
              {rental.user?.name
                ? `Customer: ${rental.user.name}`
                : `Rental #${rental._id.slice(-6)}`}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ─── Scrollable Order Details ─── */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(80, 40 + insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.statusCard}>
          <RentalStatusBanner
            statusColor={statusColor}
            statusLabel={statusLabel}
            createdAt={rental.createdAt}
          />

          <RentalTimelineStepper
            currentIndex={currentIndex}
            statusColor={statusColor}
          />
        </View>

        <RentalBookCard
          bookId={rental.bookId}
          coverUri={coverUri}
          title={rental.book?.title}
          author={rental.book?.author}
          rentPerDay={rental.rentPerDay}
        />

        <RentalCustomerCard
          name={rental.user?.name}
          email={rental.user?.email}
          phone={rental.user?.phone}
        />

        <RentalLocationCard
          type="Delivery"
          zone={rental.zone}
          location={rental.deliveryLocation as any}
          date={rental.deliveryDate}
          time={rental.deliveryTime}
        />

        <RentalLocationCard
          type="Pickup"
          zone={rental.zone}
          location={(rental.pickupLocation || rental.deliveryLocation) as any}
          date={rental.pickupDate}
          time={rental.pickupTime}
        />

        <RentalPaymentCard
          totalRent={rental.totalRent}
          lateFee={rental.lateFee}
          paymentMethod={rental.paymentMethod}
          paymentStatus={rental.paymentStatus}
          utrNumber={rental.utrNumber}
          screenshotUrl={rental.screenshotUrl}
        />

        <RentalActionButtons
          status={rental.status}
          rentalId={rental._id}
          onMarkDelivered={() =>
            handleAction(
              "Mark Delivered?",
              "Are you sure you have delivered this book to the customer?",
              () => {
                if (!accessToken)
                  return Promise.reject(new Error("Unauthenticated"));
                return markDelivered({ accessToken, rentalId: rental._id });
              },
            )
          }
          onMarkReturned={() =>
            handleAction(
              "Mark Returned?",
              "Confirm that the book has been received back in good condition and payment is verified.",
              () => {
                if (!accessToken)
                  return Promise.reject(new Error("Unauthenticated"));
                return markReturned({ accessToken, rentalId: rental._id });
              },
            )
          }
        />
      </ScrollView>

      <ConfirmActionModal
        visible={actionModal.visible}
        title={actionModal.title}
        message={actionModal.message}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onCancel={() => setActionModal((prev) => ({ ...prev, visible: false }))}
        onConfirm={executeAction}
        loading={loading}
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
  scroll: {
    paddingTop: 12,
  },
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  errorText: {
    fontSize: FontSizes.body,
    color: Colors.error,
    fontFamily: Fonts.bold,
  },
  flex: {
    flex: 1,
  },
  /* Hero Header */
  heroHeader: {
    borderBottomLeftRadius: Layout.cardRadiusLarge + scale(4),
    borderBottomRightRadius: Layout.cardRadiusLarge + scale(4),
    overflow: "hidden",
    zIndex: 10,
    elevation: 4,
    backgroundColor: Colors.primaryDark,
  },
  heroSafeArea: {},
  heroContent: {
    paddingHorizontal: Layout.screenPaddingWide,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.lg,
  },
  heroDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  heroDecorShape1: {
    position: "absolute",
    width: scale(160),
    height: scale(160),
    borderRadius: scale(80),
    backgroundColor: "rgba(255,255,255,0.05)",
    top: -scale(40),
    right: -scale(20),
  },
  heroDecorShape2: {
    position: "absolute",
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    backgroundColor: "rgba(255,255,255,0.03)",
    bottom: -scale(30),
    left: -scale(20),
  },
  topNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusBadgeText: {
    color: Colors.white,
    fontSize: FontSizes.caption,
    fontFamily: Fonts.bold,
  },
  heroTitle: {
    fontSize: FontSizes.heading,
    color: Colors.white,
    fontFamily: Fonts.bold,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: FontSizes.caption,
    color: "rgba(255,255,255,0.75)",
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
});
