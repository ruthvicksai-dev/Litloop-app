/**
 * Master barrel for components/ui.
 *
 * Re-exports every component from its subfolder so that existing imports like
 *   import Button from "@/components/ui/Button"
 * continue to work without any changes.
 *
 * New code can import from subfolders directly for clarity:
 *   import { Button } from "@/components/ui/core"
 */

// Core
export { default as Button } from "./core/Button";
export { default as InputField } from "./core/InputField";
export { default as DropdownField } from "./core/DropdownField";
export { SegmentedControl } from "./core/SegmentedControl";
export type { SegmentOption } from "./core/SegmentedControl";
export { AnimatedPressable } from "./core/AnimatedPressable";

// Feedback
export { default as BookLoader } from "./feedback/BookLoader";
export { default as LoadingOverlay } from "./feedback/LoadingOverlay";
export { EmptyState } from "./feedback/EmptyState";
export { default as ErrorBoundary } from "./feedback/ErrorBoundary";
export { default as ConfirmActionModal } from "./feedback/ConfirmActionModal";
export { NotificationPermissionModal, useNotificationRationale } from "./feedback/NotificationPermissionModal";
export { OfflineBanner } from "./feedback/OfflineBanner";

// Cards
export { default as BookCard } from "./cards/BookCard";
export { default as DiscoverBookCard } from "./cards/DiscoverBookCard";
export { default as Top10BookCard } from "./cards/Top10BookCard";
export { default as RentalCard } from "./cards/RentalCard";
export { default as SeriesCard } from "./cards/SeriesCard";
export { default as DiscoverSectionRow } from "./cards/DiscoverSectionRow";
export { default as SeriesSectionRow } from "./cards/SeriesSectionRow";

// Skeletons
export { Skeleton } from "./skeletons/Skeleton";
export { BookCardSkeleton } from "./skeletons/BookCardSkeleton";
export { DiscoverBookCardSkeleton } from "./skeletons/DiscoverBookCardSkeleton";
export { HomeSkeleton } from "./skeletons/HomeSkeleton";
export { RentalHistorySkeleton } from "./skeletons/RentalHistorySkeleton";

// Pickers
export { default as DatePickerField } from "./pickers/DatePickerField";
export { default as TimePickerField } from "./pickers/TimePickerField";
export { default as SlotDatePicker } from "./pickers/SlotDatePicker";
export { default as SlotTimePicker } from "./pickers/SlotTimePicker";
export { default as MapLocationPicker } from "./pickers/MapLocationPicker";

// Navigation
export { default as AnimatedTabBar } from "./navigation/AnimatedTabBar";

// Auth
export { default as OtpCodeInput } from "./auth/OtpCodeInput";
export { default as PasswordRequirements } from "./auth/PasswordRequirements";

// Standalone
export { default as AppSplash } from "./AppSplash";
