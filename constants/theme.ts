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

export const FEATURE_FLAGS = {
  enableMapAdjustment: false,
};
