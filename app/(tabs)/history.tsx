import RentalCard from "@/components/ui/RentalCard";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { useFadeSlideIn } from "@/hooks/useFadeSlideIn";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import React from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "@/constants/fonts";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function RentalHistoryScreen() {
    const { userId } = useAuth();
    const history = useQuery(api.rentals.getRentalHistory, userId ? { userId } : "skip");
    const { fadeAnim, slideAnim } = useFadeSlideIn();

    if (history === undefined) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
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
                        <Ionicons name="time-outline" size={SCREEN_WIDTH * 0.12} color={Colors.textLight} style={{ marginBottom: Spacing.md }} />
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
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingTop: SCREEN_HEIGHT * 0.02,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: SCREEN_WIDTH * 0.065,
        
        color: Colors.text,
      fontFamily: Fonts.bold,
    },
    subtitle: {
        fontSize: SCREEN_WIDTH * 0.035,
        color: Colors.textSecondary,
        marginTop: 4,
      fontFamily: Fonts.regular,
    },
    list: {
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingBottom: 20,
    },
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: SCREEN_HEIGHT * 0.1,
    },
    emptyIcon: {
        fontSize: SCREEN_WIDTH * 0.12,
        marginBottom: Spacing.md,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textSecondary,
      fontFamily: Fonts.regular,
    },
});
