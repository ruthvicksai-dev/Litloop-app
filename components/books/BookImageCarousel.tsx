import { Colors } from "@/constants/theme";
import React, { useRef } from "react";
import { Animated, Dimensions, FlatList, Image, Platform, StyleSheet, Text, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_WIDTH = SCREEN_WIDTH;
const IMAGE_WIDTH = SCREEN_WIDTH * 0.65;
const IMAGE_HEIGHT = IMAGE_WIDTH * 1.5;

type BookImageCarouselProps = {
    images: string[];
    activeIndex: number;
    onIndexChange: (index: number) => void;
};

export default function BookImageCarousel({
    images,
    activeIndex,
    onIndexChange,
}: BookImageCarouselProps) {
    const scrollX = useRef(new Animated.Value(0)).current;

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
                    source={{ uri: images[activeIndex] }}
                    style={styles.backgroundImage}
                    blurRadius={Platform.OS === 'ios' ? 30 : 15}
                />
                <View style={styles.backgroundOverlay} />
            </View>

            <FlatList
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
                            onIndexChange(Math.round(x / CAROUSEL_WIDTH));
                        },
                    }
                )}
                scrollEventThrottle={16}
                snapToAlignment="center"
                snapToInterval={CAROUSEL_WIDTH}
                decelerationRate="fast"
                renderItem={({ item }) => (
                    <View style={styles.galleryItem}>
                        <View style={styles.imageShadow}>
                            <Image source={{ uri: item }} style={styles.cover} />
                        </View>
                    </View>
                )}
            />

            {images.length > 1 ? (
                <View style={styles.pagination}>
                    {images.map((_, index) => {
                        const width = scrollX.interpolate({
                            inputRange: [
                                CAROUSEL_WIDTH * (index - 1),
                                CAROUSEL_WIDTH * index,
                                CAROUSEL_WIDTH * (index + 1),
                            ],
                            outputRange: [8, 20, 8],
                            extrapolate: "clamp",
                        });

                        const opacity = scrollX.interpolate({
                            inputRange: [
                                CAROUSEL_WIDTH * (index - 1),
                                CAROUSEL_WIDTH * index,
                                CAROUSEL_WIDTH * (index + 1),
                            ],
                            outputRange: [0.4, 1, 0.4],
                            extrapolate: "clamp",
                        });

                        return (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.dot,
                                    { width, opacity },
                                ]}
                            />
                        );
                    })}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: CAROUSEL_WIDTH,
        height: IMAGE_HEIGHT + 80,
        justifyContent: "center",
        overflow: "hidden",
    },
    backgroundLayer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.background,
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        width: CAROUSEL_WIDTH,
        height: IMAGE_HEIGHT + 100,
        opacity: 0.2,
        transform: [{ scale: 1.3 }],
    },
    backgroundOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.55)",
    },
    galleryItem: {
        width: CAROUSEL_WIDTH,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 20,
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
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
        borderRadius: 20,
        backgroundColor: Colors.primaryLight,
    },
    pagination: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        height: 20,
        gap: 8,
        position: 'absolute',
        bottom: 10,
        width: '100%',
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    placeholder: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.primaryLight,
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
        borderRadius: 20,
    },
    placeholderText: {
        fontSize: SCREEN_WIDTH * 0.2,
    },
});
