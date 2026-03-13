import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import { Dimensions, FlatList, Image, StyleSheet, Text, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
    if (images.length === 0) {
        return (
            <View style={[styles.cover, styles.placeholder]}>
                <Text style={styles.placeholderText}>ðŸ“–</Text>
            </View>
        );
    }

    return (
        <View>
            <FlatList
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                onScroll={(event) => {
                    const x = event.nativeEvent.contentOffset.x;
                    onIndexChange(Math.round(x / SCREEN_WIDTH));
                }}
                scrollEventThrottle={16}
                renderItem={({ item }) => (
                    <View style={styles.galleryItem}>
                        <Image source={{ uri: item }} style={styles.cover} />
                    </View>
                )}
            />
            {images.length > 1 ? (
                <View style={styles.pagination}>
                    {images.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                activeIndex === index && styles.activeDot,
                            ]}
                        />
                    ))}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    galleryItem: {
        width: SCREEN_WIDTH,
        alignItems: "center",
        justifyContent: "center",
    },
    cover: {
        width: SCREEN_WIDTH * 0.6,
        height: SCREEN_WIDTH * 0.6 * 1.5,
        borderRadius: 16,
        backgroundColor: Colors.primaryLight,
    },
    pagination: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: Spacing.md,
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.border,
    },
    activeDot: {
        width: 14,
        backgroundColor: Colors.primary,
    },
    placeholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    placeholderText: {
        fontSize: SCREEN_WIDTH * 0.2,
    },
});
