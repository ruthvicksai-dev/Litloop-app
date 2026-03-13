import BookLoader from "@/components/ui/BookLoader";
import RentalCard from "@/components/ui/RentalCard";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { useFadeSlideIn } from "@/hooks/useFadeSlideIn";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import React from "react";
import {
    Animated,
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts, FontSizes } from "@/constants/fonts";

export default function RentalHistoryScreen() {
    const { userId } = useAuth();
    const history = useQuery(api.rentals.getRentalHistory, userId ? { userId } : "skip");
    const { fadeAnim, slideAnim } = useFadeSlideIn();

    if (history === undefined) {
        return (
            <View style={styles.center}>
                <BookLoader label="Loading history..." />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <Text style={styles.title}>Rental History</Text>
                <Text style={styles.subtitle}>Past completed rentals</Text>
            </Animated.View>

            <FlatList
                data={history}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => (
                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [
                                {
                                    translateY: slideAnim.interpolate({
                                        inputRange: [0, 30],
                                        outputRange: [0, 30 + index * 6],
                                    }),
                                },
                            ],
                        }}
                    >
                        <RentalCard
                            bookTitle={item.book?.title || "Unknown Book"}
                            bookAuthor={item.book?.author || "Unknown Author"}
                            status={item.status}
                            deliveryDate={item.deliveryDate}
                            pickupDate={item.pickupDate}
                            rentPerDay={item.rentPerDay}
                            totalRent={item.totalRent}
                            zone={item.zone}
                        />
                    </Animated.View>
                )}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="time-outline" size={48} color={Colors.textLight} style={{ marginBottom: Spacing.md }} />
                        <Text style={styles.emptyText}>No rental history yet</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: FontSizes.hero,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    subtitle: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        marginTop: 4,
        fontFamily: Fonts.regular,
    },
    list: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 56,
    },
    emptyIcon: {
        fontSize: FontSizes.display,
        marginBottom: Spacing.md,
    },
    emptyText: {
        fontSize: FontSizes.subtitle,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
});
