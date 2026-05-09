import CarouselDots from "@/components/books/CarouselDots";
import { Colors } from "@/constants/theme";
import { Image } from "expo-image";
import React, { useRef } from "react";
import { Animated, FlatList, Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Fonts, FontSizes } from "@/constants/fonts";

type BookImageCarouselProps = {
    images: string[];
    activeIndex: number;
    onIndexChange: (index: number) => void;
    isUnavailable?: boolean;
};

export default function BookImageCarousel({
    images,
    activeIndex,
    onIndexChange,
    isUnavailable = false,
}: BookImageCarouselProps) {
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList<string>>(null);
    const { width } = useWindowDimensions();
    const carouselWidth = width;
    const imageWidth = Math.min(width * 0.65, 320);
    const imageHeight = imageWidth * 1.5;

    if (images.length === 0) {
        return (
            <View style={[styles.cover, styles.placeholder]}>
                <Text style={styles.placeholderText}>📖</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Background Blur Effect (Simulated) */}
            <View style={styles.backgroundLayer}>
                <Image
                    source={images[activeIndex]}
                    style={styles.backgroundImage}
                    blurRadius={Platform.OS === 'ios' ? 30 : 15}
                    cachePolicy="disk"
                    contentFit="cover"
                />
                <View style={styles.backgroundOverlay} />
            </View>

            <FlatList
                ref={flatListRef}
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    {
                        useNativeDriver: false,
                        listener: (event: any) => {
                            const x = event.nativeEvent.contentOffset.x;
                            onIndexChange(Math.round(x / carouselWidth));
                        },
                    }
                )}
                scrollEventThrottle={16}
                snapToAlignment="center"
                snapToInterval={carouselWidth}
                decelerationRate="fast"
                renderItem={({ item }) => (
                    <View style={[styles.galleryItem, { width: carouselWidth }]}>
                        <View style={styles.imageShadow}>
                            <View style={[styles.coverWrap, { width: imageWidth, height: imageHeight }]}>
                                <Image
                                    source={item}
                                    style={[styles.cover, { width: imageWidth, height: imageHeight }]}
                                    cachePolicy="disk"
                                    contentFit="cover"
                                />
                                {isUnavailable ? (
                                    <View style={styles.unavailableOverlay}>
                                        <View style={styles.unavailableBadge}>
                                            <View style={styles.unavailableDot} />
                                            <Text style={styles.unavailableText}>Unavailable</Text>
                                        </View>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                    </View>
                )}
            />

            <CarouselDots
                images={images}
                activeIndex={activeIndex}
                onIndexChange={(index) => {
                    flatListRef.current?.scrollToIndex({
                        index,
                        animated: true,
                    });
                    onIndexChange(index);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
    },
    backgroundLayer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.background,
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.2,
        transform: [{ scale: 1.3 }],
    },
    backgroundOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.55)",
    },
    galleryItem: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 20,
        paddingBottom: 44,
    },
    imageShadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
        elevation: 15,
        borderRadius: 20,
        backgroundColor: Colors.white,
    },
    cover: {
        borderRadius: 20,
        backgroundColor: Colors.primaryLight,
    },
    coverWrap: {
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
    },
    unavailableOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.28)",
        paddingHorizontal: 14,
        paddingBottom: 14,
    },
    unavailableBadge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "stretch",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: "rgba(24, 24, 27, 0.78)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.12)",
    },
    unavailableDot: {
        width: 8,
        height: 8,
        borderRadius: 999,
        backgroundColor: Colors.error,
        marginRight: 10,
    },
    unavailableText: {
        color: Colors.error,
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        letterSpacing: 0.2,
    },
    placeholder: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.primaryLight,
        width: "65%",
        maxWidth: 320,
        aspectRatio: 2 / 3,
        alignSelf: "center",
        borderRadius: 20,
    },
    placeholderText: {
        fontSize: FontSizes.display,
        fontFamily: Fonts.regular,
    },
});
