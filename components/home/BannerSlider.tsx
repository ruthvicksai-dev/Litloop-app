import { Shadows } from "@/constants/designTokens";
import { Colors, scale, Spacing } from "@/constants/theme";
import { triggerHaptic } from "@/utils";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";

export interface BannerItem {
  _id: string;
  bannerImageUrl: string;
  title?: string;
}

interface BannerSliderProps {
  banners: BannerItem[];
  autoPlayInterval?: number;
  onBannerPress?: (banner: BannerItem) => void;
}

export default function BannerSlider({
  banners,
  autoPlayInterval = 10000,
  onBannerPress,
}: BannerSliderProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<BannerItem>>(null);
  const isUserInteracting = useRef(false);

  // Full-width carousel item dimensions (16:9 ratio for perfect fit without white space or cropping)
  const containerPadding = Spacing.md * 2;
  const cardWidth = Math.min(windowWidth - containerPadding, 600);
  const cardHeight = Math.round(cardWidth * (9 / 16));

  // Use actual database banners dynamically
  const displayBanners = React.useMemo(() => {
    if (!banners || banners.length === 0) return [];
    return banners;
  }, [banners]);

  // Auto-play timer loop
  useEffect(() => {
    if (displayBanners.length <= 1) return;

    const interval = setInterval(() => {
      if (!isUserInteracting.current && flatListRef.current) {
        setActiveIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % displayBanners.length;
          try {
            flatListRef.current?.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
          } catch {
            // Safe fallback if list layout is unmounted or updating
          }
          return nextIndex;
        });
      }
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [displayBanners.length, autoPlayInterval]);

  // Handle scroll position to update active index
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffsetX / cardWidth);
      if (
        index >= 0 &&
        index < displayBanners.length &&
        index !== activeIndex
      ) {
        setActiveIndex(index);
      }
    },
    [cardWidth, displayBanners.length, activeIndex],
  );

  const handleScrollBeginDrag = useCallback(() => {
    isUserInteracting.current = true;
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    setTimeout(() => {
      isUserInteracting.current = false;
    }, 1000);
  }, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: cardWidth,
      offset: cardWidth * index,
      index,
    }),
    [cardWidth],
  );

  if (!displayBanners || displayBanners.length === 0) {
    return null;
  }

  return (
    <View style={styles.outerContainer}>
      <View
        style={[styles.sliderWrapper, { width: cardWidth, height: cardHeight }]}
      >
        <FlatList
          ref={flatListRef}
          data={displayBanners}
          keyExtractor={(item, index) => item._id ?? `banner-${index}`}
          horizontal
          nestedScrollEnabled={true}
          pagingEnabled={true}
          snapToInterval={cardWidth}
          snapToAlignment="start"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={(info) => {
            flatListRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: true,
            });
          }}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.cardContainer,
                { width: cardWidth, height: cardHeight },
                pressed && styles.pressed,
              ]}
              onPress={() => {
                triggerHaptic("light");
                onBannerPress?.(item);
              }}
            >
              <Image
                source={item.bannerImageUrl}
                style={styles.bannerImage}
                contentFit="cover"
                cachePolicy="disk"
                transition={300}
              />
            </Pressable>
          )}
        />
      </View>

      {/* Pagination Indicators */}
      <View style={styles.paginationContainer}>
        {displayBanners.map((banner, index) => {
          const isActive = index === activeIndex;
          return (
            <View
              key={banner._id}
              style={[
                styles.dot,
                isActive ? styles.dotActive : styles.dotInactive,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    marginVertical: Spacing.md,
    alignItems: "center",
  },
  sliderWrapper: {
    borderRadius: scale(16),
    overflow: "hidden",
  },
  cardContainer: {
    borderRadius: scale(16),
    overflow: "hidden",
    backgroundColor: Colors.surfaceCard,
    ...Shadows.card,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: scale(12),
  },
  dot: {
    height: scale(6),
    borderRadius: scale(3),
    marginHorizontal: scale(3),
  },
  dotActive: {
    width: scale(20),
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    width: scale(6),
    backgroundColor: Colors.textSecondary + "40",
  },
});
