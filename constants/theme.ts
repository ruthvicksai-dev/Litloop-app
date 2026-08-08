import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const guidelineBaseWidth = 375;

export const scale = (size: number) => (width / guidelineBaseWidth) * size;

export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const Colors = {
  primary: "#6D3A3D",
  primaryDark: "#5A2F32",
  primaryLight: "#EBD9C0",
  primaryAccent: "#D4886A",
  white: "#FFFFFF",
  background: "#F8EDDA",
  surfaceCard: "#FFFFFF",
  surfaceSecondary: "rgba(255,255,255,0.72)",
  surfacePressed: "rgba(0,0,0,0.03)",
  card: "#6D3A3D",
  text: "#1A1714",
  textSecondary: "#6E6862",
  textLight: "#A39E98",
  border: "#E5E0DB",
  borderSubtle: "rgba(0,0,0,0.05)",
  error: "#E5453A",
  success: "#1DAA54",
  warning: "#E89B0C",
  shadow: "rgba(50,30,20,0.45)",
};

export const Fonts = {
  regular: {
    fontSize: moderateScale(14),
    color: Colors.text,
  },
  medium: {
    fontSize: moderateScale(16),
    color: Colors.text,
  },
  large: {
    fontSize: moderateScale(18),
    color: Colors.text,
    fontWeight: "600" as const,
  },
  title: {
    fontSize: moderateScale(22),
    color: Colors.text,
    fontWeight: "700" as const,
  },
  caption: {
    fontSize: moderateScale(12),
    color: Colors.textSecondary,
  },
};

export const Spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
};

export const Layout = {
  screenPadding: scale(16),
  screenPaddingWide: scale(20),
  sectionGap: scale(24),
  borderRadius: scale(12),
  cardRadius: scale(16),
  cardRadiusLarge: scale(20),
  iconSize: scale(24),
  buttonHeight: scale(48),
  touchSize: scale(44),
  maxContentWidth: scale(640),
  tabBarHeight: scale(75),
  headerHeight: scale(60),
  badgeSize: scale(10),
  badgeInset: scale(12),
};

export const ZONES = ["Home", "College"];

export type RentalStatus =
  | "requested"
  | "delivery_scheduled"
  | "delivered"
  | "pickup_scheduled"
  | "payment_pending"
  | "paid"
  | "returned";

export type PaymentStatus =
  | "pending"
  | "verification_pending"
  | "cash_pending"
  | "paid"
  | "rejected"
  | "expired"
  | "cancelled";

export type StudentVerificationStatus = "pending" | "approved" | "rejected";

export type BugReportStatus =
  | "open"
  | "investigating"
  | "in_progress"
  | "fixed"
  | "closed"
  | "rejected";

export type BugReportPriority = "low" | "medium" | "high" | "critical";

export const RENTAL_STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  delivery_scheduled: "Delivery Scheduled",
  delivered: "Active Rental",
  pickup_scheduled: "Pickup Scheduled",
  payment_pending: "Payment Pending",
  paid: "Paid • Ready for Return",
  returned: "Returned & Restocked",
};

export const STATUS_COLORS: Record<string, string> = {
  requested: "#F59E0B",
  delivery_scheduled: "#3B82F6",
  delivered: "#8B5CF6",
  pickup_scheduled: "#06B6D4",
  payment_pending: "#F97316",
  paid: "#10B981",
  returned: "#6B7280",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Payment Pending",
  verification_pending: "Verifying UPI Payment",
  cash_pending: "Cash on Pickup",
  paid: "Payment Verified",
  rejected: "Payment Rejected",
  expired: "Payment Expired",
  cancelled: "Pickup Cancelled",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  verification_pending: "#8B5CF6",
  cash_pending: "#10B981",
  paid: "#10B981",
  rejected: "#EF4444",
  expired: "#6B7280",
  cancelled: "#9CA3AF",
};

export const STUDENT_VERIFICATION_LABELS: Record<string, string> = {
  pending: "Under Review",
  approved: "Verified Student",
  rejected: "Rejected",
};

export const STUDENT_VERIFICATION_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  approved: "#10B981",
  rejected: "#EF4444",
};

export const BUG_REPORT_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  investigating: "Investigating",
  in_progress: "In Progress",
  fixed: "Fixed",
  closed: "Closed",
  rejected: "Rejected",
};

export const BUG_REPORT_STATUS_COLORS: Record<string, string> = {
  open: "#F59E0B",
  investigating: "#3B82F6",
  in_progress: "#8B5CF6",
  fixed: "#10B981",
  closed: "#6B7280",
  rejected: "#EF4444",
};

export interface RentalStatusMeta {
  label: string;
  badgeText: string;
  color: string;
  bgColor: string;
  icon: string;
  stepIndex: number;
  isActionable: boolean;
  isTerminal: boolean;
  paymentLabel?: string;
  paymentColor?: string;
  allowedActions: Array<
    | "schedule_delivery"
    | "mark_delivered"
    | "verify_upi"
    | "verify_cash"
    | "mark_returned"
    | "reverify_payment"
  >;
}

/**
 * Enterprise deterministic state-engine resolver for LitLoop rentals.
 * Resolves fulfillment status + payment status + payment method into a coherent metadata object.
 */
export function getRentalStatusMeta(item?: {
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
}): RentalStatusMeta {
  const status = (item?.status ?? "requested") as RentalStatus;
  const paymentStatus = (item?.paymentStatus ?? "") as PaymentStatus;
  const paymentMethod = item?.paymentMethod ?? "";

  // 1. Requested: Awaiting delivery schedule
  if (status === "requested") {
    return {
      label: "Requested",
      badgeText: "Requested",
      color: STATUS_COLORS.requested,
      bgColor: STATUS_COLORS.requested + "18",
      icon: "document-text-outline",
      stepIndex: 0,
      isActionable: true,
      isTerminal: false,
      allowedActions: ["schedule_delivery"],
    };
  }

  // 2. Delivery Scheduled: Ready for dispatch
  if (status === "delivery_scheduled") {
    return {
      label: "Delivery Scheduled",
      badgeText: "Delivery Scheduled",
      color: STATUS_COLORS.delivery_scheduled,
      bgColor: STATUS_COLORS.delivery_scheduled + "18",
      icon: "calendar-outline",
      stepIndex: 1,
      isActionable: true,
      isTerminal: false,
      allowedActions: ["mark_delivered"],
    };
  }

  // 3. Delivered: Book in reader's hands (Reading period)
  if (status === "delivered") {
    return {
      label: "Active Rental",
      badgeText: "Delivered",
      color: STATUS_COLORS.delivered,
      bgColor: STATUS_COLORS.delivered + "18",
      icon: "book-outline",
      stepIndex: 2,
      isActionable: false,
      isTerminal: false,
      allowedActions: [],
    };
  }

  // 4. Return Phase: Pickup Scheduled / Payment Pending / Verification
  if (status === "pickup_scheduled" || status === "payment_pending") {
    // 4A: Payment was rejected by admin
    if (paymentStatus === "rejected") {
      return {
        label: "Payment Rejected",
        badgeText: "Payment Rejected",
        color: "#EF4444",
        bgColor: "#EF444418",
        icon: "alert-circle-outline",
        stepIndex: 3,
        isActionable: true,
        isTerminal: false,
        paymentLabel: "Rejected • Awaiting Resubmission",
        paymentColor: "#EF4444",
        allowedActions: ["reverify_payment"],
      };
    }

    // 4B: Cash on Pickup selected
    if (paymentStatus === "cash_pending" || paymentMethod === "cash") {
      return {
        label: "Cash on Pickup",
        badgeText: "Cash on Pickup",
        color: "#10B981",
        bgColor: "#10B98118",
        icon: "cash-outline",
        stepIndex: 3,
        isActionable: true,
        isTerminal: false,
        paymentLabel: "Cash on Pickup",
        paymentColor: "#10B981",
        allowedActions: ["verify_cash"],
      };
    }

    // 4C: UPI screenshot or UTR submitted, awaiting admin verification
    if (paymentStatus === "verification_pending" || (status === "payment_pending" && paymentMethod === "upi")) {
      return {
        label: "Verifying Payment",
        badgeText: "Verifying UPI",
        color: "#8B5CF6",
        bgColor: "#8B5CF618",
        icon: "shield-checkmark-outline",
        stepIndex: 3,
        isActionable: true,
        isTerminal: false,
        paymentLabel: "UPI Verification Pending",
        paymentColor: "#8B5CF6",
        allowedActions: ["verify_upi"],
      };
    }

    // 4D: Payment pending (waiting for customer to choose cash or submit UPI)
    if (status === "payment_pending") {
      return {
        label: "Payment Pending",
        badgeText: "Payment Pending",
        color: "#F59E0B",
        bgColor: "#F59E0B18",
        icon: "time-outline",
        stepIndex: 3,
        isActionable: false,
        isTerminal: false,
        paymentLabel: "Payment Pending",
        paymentColor: "#F59E0B",
        allowedActions: [],
      };
    }

    // 4E: Pickup scheduled
    return {
      label: "Pickup Scheduled",
      badgeText: "Pickup Scheduled",
      color: "#06B6D4",
      bgColor: "#06B6D418",
      icon: "bicycle-outline",
      stepIndex: 3,
      isActionable: false,
      isTerminal: false,
      paymentLabel: "Pickup Scheduled",
      paymentColor: "#06B6D4",
      allowedActions: [],
    };
  }

  // 5. Paid: Payment verified, book ready to be checked in and restocked
  if (status === "paid") {
    return {
      label: "Paid",
      badgeText: "Paid • Ready to Return",
      color: STATUS_COLORS.paid,
      bgColor: STATUS_COLORS.paid + "18",
      icon: "checkmark-done-circle-outline",
      stepIndex: 4,
      isActionable: true,
      isTerminal: false,
      paymentLabel: "Paid & Verified",
      paymentColor: STATUS_COLORS.paid,
      allowedActions: ["mark_returned"],
    };
  }

  // 6. Returned: Completed historical order
  if (status === "returned") {
    return {
      label: "Returned",
      badgeText: "Returned & Restocked",
      color: STATUS_COLORS.returned,
      bgColor: STATUS_COLORS.returned + "18",
      icon: "checkmark-circle-outline",
      stepIndex: 5,
      isActionable: false,
      isTerminal: true,
      paymentLabel: "Completed",
      paymentColor: STATUS_COLORS.returned,
      allowedActions: [],
    };
  }

  // Fallback
  return {
    label: status,
    badgeText: status,
    color: Colors.textSecondary,
    bgColor: Colors.surfacePressed,
    icon: "help-circle-outline",
    stepIndex: 0,
    isActionable: false,
    isTerminal: false,
    allowedActions: [],
  };
}

export const FEATURE_FLAGS = {
  enableMapAdjustment: false,
};

