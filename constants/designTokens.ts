/**
 * Design Tokens — Centralized style presets for the LitLoop premium redesign.
 *
 * Import these presets instead of writing inline shadows, borders, and card
 * styles. Every surface-level visual decision lives here so changes propagate
 * globally.
 */

import { Platform, ViewStyle, TextStyle } from "react-native";
import { Colors, Spacing, Layout, scale } from "./theme";
import { Fonts, FontSizes } from "./fonts";

/* ─── Shadow Presets ──────────────────────────────────────────────────── */

/**
 * Platform-aware shadow factory.
 * On Android we cap elevation and tint the shadow warm to prevent harsh
 * black fringing. On iOS we use shadowColor/Offset/Opacity/Radius.
 */
const shadow = (
    offsetY: number,
    opacity: number,
    radius: number,
    elevation: number,
    color: string = Colors.shadow,
): ViewStyle =>
    Platform.select({
        ios: {
            shadowColor: color,
            shadowOffset: { width: 0, height: offsetY },
            shadowOpacity: opacity,
            shadowRadius: radius,
        },
        android: {
            elevation: Math.min(elevation, 6),
            shadowColor: color,
        },
        default: {},
    }) as ViewStyle;

export const Shadows = {
    /** Barely-there lift — cards at rest */
    none: shadow(0, 0, 0, 0),

    /** Subtle resting shadow for surfaces */
    subtle: shadow(1, 0.04, 3, 1, "rgba(60,40,30,0.5)"),

    /** Default card shadow — soft warm tint */
    card: shadow(2, 0.06, 8, 2, "rgba(60,40,30,0.45)"),

    /** Elevated surface — modals, floating elements */
    elevated: shadow(4, 0.08, 16, 3, "rgba(60,40,30,0.4)"),

    /** Primary-tinted shadow for CTA buttons */
    primary: shadow(3, 0.18, 10, 3, Colors.primary),
};

/* ─── Border Presets ──────────────────────────────────────────────────── */

export const Borders = {
    /** Ultra-thin card border — subtle depth without shadow */
    subtle: {
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
    } as ViewStyle,

    /** Standard card border */
    card: {
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
    } as ViewStyle,

    /** Input field border */
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
    } as ViewStyle,

    /** Focused input border */
    inputFocus: {
        borderWidth: 1.5,
        borderColor: Colors.primary,
    } as ViewStyle,

    /** Error input border */
    inputError: {
        borderWidth: 1.5,
        borderColor: Colors.error,
    } as ViewStyle,

    /** Divider — horizontal rule */
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    } as ViewStyle,
};

/* ─── Surface Colors ──────────────────────────────────────────────────── */

export const Surfaces = {
    /** Base page background */
    page: Colors.background,

    /** Card / elevated container background */
    card: "#FFFFFF",

    /** Very slightly tinted surface for nested containers */
    secondary: "rgba(255,255,255,0.7)",

    /** Pressed state overlay */
    pressed: "rgba(0,0,0,0.03)",

    /** Subtle tinted surface for tags, chips, info boxes */
    tinted: `${Colors.primary}08`,

    /** Active/selected chip background */
    activeTint: `${Colors.primary}12`,
};

/* ─── Card Style Presets ──────────────────────────────────────────────── */

export const CardStyles = {
    /** Default card — clean white with subtle border */
    default: {
        backgroundColor: Surfaces.card,
        borderRadius: Layout.cardRadius,
        ...Borders.card,
        ...Shadows.subtle,
    } as ViewStyle,

    /** Elevated card — modals, floating panels */
    elevated: {
        backgroundColor: Surfaces.card,
        borderRadius: Layout.cardRadiusLarge,
        ...Borders.subtle,
        ...Shadows.card,
    } as ViewStyle,

    /** Flat card — no shadow, border only */
    flat: {
        backgroundColor: Surfaces.card,
        borderRadius: Layout.cardRadius,
        ...Borders.card,
    } as ViewStyle,

    /** Inset/recessed surface — for nested containers */
    inset: {
        backgroundColor: Surfaces.secondary,
        borderRadius: Layout.borderRadius,
        ...Borders.subtle,
    } as ViewStyle,
};

/* ─── Input Style Presets ─────────────────────────────────────────────── */

export const InputStyles = {
    container: {
        marginBottom: Spacing.md,
    } as ViewStyle,

    label: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.xs + 2,
        letterSpacing: 0.1,
    } as TextStyle,

    field: {
        backgroundColor: Surfaces.card,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: Spacing.md,
        paddingVertical: scale(13),
        fontSize: FontSizes.subtitle,
        color: Colors.text,
        fontFamily: Fonts.regular,
        minHeight: Layout.buttonHeight,
        ...Borders.input,
    } as TextStyle,

    fieldFocused: {
        ...Borders.inputFocus,
    } as ViewStyle,

    fieldError: {
        ...Borders.inputError,
    } as ViewStyle,

    helperText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    } as TextStyle,

    errorText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.error,
        marginTop: Spacing.xs,
    } as TextStyle,
};

/* ─── Modal Style Presets ─────────────────────────────────────────────── */

export const ModalStyles = {
    /** Full-screen backdrop overlay */
    overlay: {
        flex: 1,
        backgroundColor: "rgba(20, 15, 12, 0.35)",
        justifyContent: "center",
        paddingHorizontal: Spacing.lg,
    } as ViewStyle,

    /** Bottom sheet overlay */
    bottomOverlay: {
        flex: 1,
        backgroundColor: "rgba(20, 15, 12, 0.35)",
        justifyContent: "flex-end",
    } as ViewStyle,

    /** Centered modal card */
    sheet: {
        backgroundColor: Surfaces.card,
        borderRadius: Layout.cardRadiusLarge + 4,
        padding: Spacing.xl,
        ...Shadows.elevated,
    } as ViewStyle,

    /** Bottom sheet card */
    bottomSheet: {
        backgroundColor: Surfaces.card,
        borderTopLeftRadius: Layout.cardRadiusLarge + 4,
        borderTopRightRadius: Layout.cardRadiusLarge + 4,
        paddingBottom: Spacing.xl,
        ...Shadows.elevated,
    } as ViewStyle,

    /** Modal header row */
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        ...Borders.divider,
    } as ViewStyle,

    /** Modal title text */
    title: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
    } as TextStyle,
};

/* ─── Screen Header Presets ───────────────────────────────────────────── */

export const HeaderStyles = {
    /** Standard screen header container */
    container: {
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    } as ViewStyle,

    /** Header with row layout (title + action) */
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    } as ViewStyle,

    /** Page title */
    title: {
        fontSize: FontSizes.heading,
        color: Colors.text,
        fontFamily: Fonts.bold,
        letterSpacing: -0.3,
    } as TextStyle,

    /** Page subtitle */
    subtitle: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        marginTop: Spacing.xs,
    } as TextStyle,

    /** Header action button (settings icon, filter, etc.) */
    actionButton: {
        width: Layout.touchSize,
        height: Layout.touchSize,
        borderRadius: Layout.touchSize / 2,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
};

/* ─── Animation Timing ────────────────────────────────────────────────── */

export const Timing = {
    /** Quick micro-interactions — button press, toggle */
    fast: 150,
    /** Standard transitions — page elements, cards */
    normal: 280,
    /** Deliberate motion — modals, overlays */
    slow: 400,
    /** Entrance animations */
    entrance: 500,
};

/* ─── Spring Configs (for Reanimated) ─────────────────────────────────── */

export const Springs = {
    /** Snappy button press feedback */
    button: { damping: 15, stiffness: 400, mass: 0.8 },
    /** Smooth card interaction */
    card: { damping: 18, stiffness: 300, mass: 1 },
    /** Gentle page element */
    gentle: { damping: 20, stiffness: 200, mass: 1 },
    /** Bouncy element */
    bouncy: { damping: 12, stiffness: 350, mass: 0.8 },
};

/* ─── Opacity Tokens ──────────────────────────────────────────────────── */

export const Opacity = {
    disabled: 0.45,
    pressed: 0.85,
    subtle: 0.6,
    overlay: 0.35,
};

/* ─── Common Layout Helpers ───────────────────────────────────────────── */

export const ListStyles = {
    /** Standard screen list container */
    container: {
        flexGrow: 1,
        paddingHorizontal: Layout.screenPaddingWide,
        paddingBottom: Layout.tabBarHeight + Spacing.lg,
    } as ViewStyle,

    /** Horizontal section list */
    horizontal: {
        paddingLeft: Layout.screenPaddingWide,
        paddingRight: Spacing.md - Spacing.xs,
        paddingBottom: Spacing.sm,
    } as ViewStyle,
};
