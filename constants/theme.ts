import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const guidelineBaseWidth = 375;

export const scale = (size: number) => (width / guidelineBaseWidth) * size;

export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const Colors = {
  primary: "#754043",
  primaryDark: "#754043",
  primaryLight: "#eadbc3ff",
  white: "#FFFFFF",
  background: "#F9EEDC",
  card: "#754043",
  text: "#1C1917",
  textSecondary: "#78716C",
  textLight: "#A8A29E",
  border: "#E7E5E4",
  error: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
  shadow: "#000000",
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
};

export const ZONES = ["Home", "College"];

export const RENTAL_STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  delivery_scheduled: "Delivery Scheduled",
  delivered: "Delivered",
  pickup_scheduled: "Pickup Scheduled",
  payment_pending: "Payment Pending",
  paid: "Paid",
  returned: "Returned",
};

export const STATUS_COLORS: Record<string, string> = {
  requested: "#F59E0B",
  delivery_scheduled: "#3B82F6",
  delivered: "#8B5CF6",
  pickup_scheduled: "#06B6D4",
  payment_pending: "#F97316",
  paid: "#22C55E",
  returned: "#6B7280",
};
