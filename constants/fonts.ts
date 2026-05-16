import { moderateScale } from "@/constants/theme";

export const Fonts = {
    light: "Lato-Light",
    lightItalic: "Lato-LightItalic",
    regular: "Lato-Regular",
    italic: "Lato-Italic",
    medium: "Lato-Medium",
    mediumItalic: "Lato-MediumItalic",
    bold: "Lato-Bold",
    boldItalic: "Lato-BoldItalic",
};

export const FontSizes = {
    tiny: moderateScale(10),
    caption: moderateScale(12),
    small: moderateScale(13),
    body: moderateScale(14),
    bodyLarge: moderateScale(15),
    subtitle: moderateScale(16),
    title: moderateScale(18),
    titleLarge: moderateScale(20),
    heading: moderateScale(24),
    hero: moderateScale(30),
    display: moderateScale(32),
};

export const LetterSpacing = {
    tight: -0.4,
    normal: 0,
    wide: 0.3,
    caps: 0.8,
};

export const LineHeights = {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
};

