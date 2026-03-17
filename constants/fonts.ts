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
