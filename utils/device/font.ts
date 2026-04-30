import { Dimensions, PixelRatio } from "react-native";

const BASE_WIDTH = 375;

export const responsiveFont = (size: number) => {
    const { width } = Dimensions.get("window");
    const scale = width / BASE_WIDTH;
    const scaledSize = size * scale;
    const rounded = PixelRatio.roundToNearestPixel(scaledSize);

    return Math.round(rounded);
};
