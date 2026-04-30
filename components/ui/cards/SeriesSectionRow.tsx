import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing, moderateScale, scale } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import DiscoverBookCard from "./DiscoverBookCard";
import SeriesCard from "./SeriesCard";

interface SeriesWithBooks {
    _id: string;
    name: string;
    coverUrl: string | null;
    books: any[];
}

interface SeriesSectionRowProps {
    title: string;
    subtitle?: string;
    series: SeriesWithBooks[];
}

export default function SeriesSectionRow({
    title,
    subtitle,
    series,
}: SeriesSectionRowProps) {
    const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    const activeSeries = series.find((item) => item._id === activeSeriesId);

    if (!series || series.length === 0) return null;

    const handleSeriesPress = (id: string) => {
        setActiveSeriesId(id);
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    };

    const handleBack = () => {
        setActiveSeriesId(null);
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.titleText} allowFontScaling={false}>
                        {activeSeries ? activeSeries.name : title}
                    </Text>
                    {subtitle && !activeSeries ? (
                        <Text style={styles.subtitle} allowFontScaling={false}>
                            {subtitle}
                        </Text>
                    ) : null}
                    {activeSeries ? (
                        <Text style={styles.subtitle} allowFontScaling={false}>
                            Showing {activeSeries.books.length} books
                        </Text>
                    ) : null}
                </View>
                {activeSeries ? (
                    <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                        <Ionicons name="arrow-back" size={16} color={Colors.primary} />
                        <Text style={styles.backBtnText} allowFontScaling={false}>
                            Back
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            <View style={styles.contentContainer}>
                {!activeSeriesId ? (
                    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)}>
                        <FlatList
                            data={series}
                            horizontal
                            keyExtractor={(item) => item._id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.list}
                            renderItem={({ item }) => (
                                <SeriesCard
                                    _id={item._id}
                                    name={item.name}
                                    coverUrl={item.coverUrl}
                                    onPress={() => handleSeriesPress(item._id)}
                                />
                            )}
                        />
                    </Animated.View>
                ) : (
                    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)}>
                        <FlatList
                            ref={flatListRef}
                            data={activeSeries?.books || []}
                            horizontal
                            keyExtractor={(item) => item._id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.list}
                            renderItem={({ item }) => (
                                <DiscoverBookCard
                                    _id={item._id}
                                    title={item.title}
                                    author={item.author}
                                    rentPerDay={item.rentPerDay}
                                    availableCopies={item.availableCopies}
                                    coverUrl={item.coverUrl}
                                    coverUrls={item.coverUrls}
                                    genre={item.genre ?? item.genres?.[0]}
                                    bookViews={item.bookViews}
                                />
                            )}
                        />
                    </Animated.View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    contentContainer: {
        minHeight: scale(220),
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Layout.screenPaddingWide,
        marginBottom: Spacing.sm,
    },
    headerLeft: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    titleText: {
        fontSize: moderateScale(22),
        color: Colors.primaryDark,
        fontFamily: Fonts.bold,
        letterSpacing: -0.4,
    },
    subtitle: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        marginTop: Spacing.xs / 2,
    },
    backBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.primary + "15",
        paddingHorizontal: scale(10),
        paddingVertical: Spacing.xs,
        borderRadius: Layout.borderRadius,
        gap: 4,
    },
    backBtnText: {
        fontSize: FontSizes.small,
        color: Colors.primary,
        fontFamily: Fonts.bold,
    },
    list: {
        paddingLeft: Layout.screenPaddingWide,
        paddingRight: Spacing.md - Spacing.xs,
        paddingBottom: Spacing.sm,
        alignItems: "flex-start",
    },
});
