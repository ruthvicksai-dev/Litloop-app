import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

interface SeriesCardProps {
    _id: string;
    name: string;
    coverUrl: string | null;
    onPress: () => void;
}

export default function SeriesCard({
    _id,
    name,
    coverUrl,
    onPress,
}: SeriesCardProps) {
    return (
        <Animated.View entering={FadeInRight.duration(400)}>
            <TouchableOpacity
                style={styles.shadowContainer}
                onPress={onPress}
                activeOpacity={0.9}
            >
                <View style={styles.container}>
                    <View style={styles.imageContainer}>
                        {coverUrl ? (
                            <Image source={{ uri: coverUrl }} style={styles.image} />
                        ) : (
                            <View style={[styles.image, styles.placeholder]}>
                                <Text style={styles.placeholderText}>{name[0]}</Text>
                            </View>
                        )}

                        <LinearGradient
                            colors={["transparent", "rgba(0,0,0,0.8)"]}
                            style={styles.gradient}
                        />

                        <View style={styles.content}>
                            <Text style={styles.name} numberOfLines={2}>
                                {name}
                            </Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>SERIES</Text>
                            </View>
                        </View>

                        {/* Side Arrow Indicator */}
                        <View style={styles.arrowContainer}>
                            <Ionicons name="chevron-forward" size={16} color={Colors.white} />
                        </View>
                    </View>
                    </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    shadowContainer: {
        width: 140,
        height: 210,
        marginRight: 16,
        borderRadius: 16,
        backgroundColor: Colors.white,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    container: {
        flex: 1,
        borderRadius: 16,
        overflow: "hidden",
    },
    imageContainer: {
        flex: 1,
        position: 'relative',
    },
    image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    placeholder: {
        backgroundColor: Colors.primary + "20",
        alignItems: "center",
        justifyContent: "center",
    },
    placeholderText: {
        fontSize: FontSizes.display,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    gradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "60%",
    },
    content: {
        position: "absolute",
        bottom: 12,
        left: 12,
        right: 12,
    },
    arrowContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 4,
        borderRadius: 8,
    },
    name: {
        fontSize: FontSizes.body,
        color: Colors.white,
        fontFamily: Fonts.bold,
        marginBottom: 4,
    },
    badge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: "flex-start",
    },
    badgeText: {
        fontSize: 8,
        color: Colors.white,
        fontFamily: Fonts.bold,
        letterSpacing: 0.5,
    },
});
