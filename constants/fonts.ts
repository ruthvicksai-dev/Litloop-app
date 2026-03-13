import { responsiveFont } from "@/utils/responsiveFont";

export const Fonts = {
    light: "IosevkaCharonMono-Light",
    lightItalic: "IosevkaCharonMono-LightItalic",
    regular: "IosevkaCharonMono-Regular",
    italic: "IosevkaCharonMono-Italic",
    medium: "IosevkaCharonMono-Medium",
    mediumItalic: "IosevkaCharonMono-MediumItalic",
    bold: "IosevkaCharonMono-Bold",
    boldItalic: "IosevkaCharonMono-BoldItalic",
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
