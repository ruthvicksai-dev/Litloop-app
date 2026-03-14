import { responsiveFont } from "@/utils/responsiveFont";

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
    tiny: responsiveFont(10),
    caption: responsiveFont(12),
    small: responsiveFont(13),
    body: responsiveFont(14),
    bodyLarge: responsiveFont(15),
    subtitle: responsiveFont(16),
    title: responsiveFont(18),
    titleLarge: responsiveFont(20),
    heading: responsiveFont(24),
    hero: responsiveFont(30),
    display: responsiveFont(32),
};
