import { FontSizes } from "@/constants/fonts";

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
  regular: { fontSize: FontSizes.body, color: Colors.text },
  medium: { fontSize: FontSizes.subtitle, color: Colors.text },
  large: { fontSize: FontSizes.title, color: Colors.text, fontWeight: "600" as const },
  title: { fontSize: FontSizes.titleLarge, color: Colors.text, fontWeight: "700" as const },
  caption: { fontSize: FontSizes.caption, color: Colors.textSecondary },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const ZONES = [
  "Home",
  "College",
];

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
