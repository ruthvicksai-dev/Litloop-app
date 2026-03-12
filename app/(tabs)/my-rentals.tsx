import RentalCard from "@/components/ui/RentalCard";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function MyRentalsScreen() {
    const { userId } = useAuth();
    const rentals = useQuery(
        api.rentals.getUserRentals,
        userId ? { userId } : "skip"
    );
    const router = useRouter();

    // Entrance animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    if (rentals === undefined) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const handleRentalPress = (rental: any) => {
        if (rental.status === "delivered") {
            router.push(`/rental/schedule-return?rentalId=${rental._id}`);
        } else if (rental.status === "pickup_scheduled") {
            router.push(`/rental/payment?rentalId=${rental._id}`);
        }
    };

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
                <Text style={styles.title}>My Rentals</Text>
                <Text style={styles.subtitle}>Active book rentals</Text>
            </Animated.View>

            <FlatList
                data={rentals}
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
                            onPress={() => handleRentalPress(item)}
                        />
                    </Animated.View>
                )}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyText}>No active rentals</Text>
                        <TouchableOpacity
                            onPress={() => router.push("/(tabs)")}
                        >
                            <Text style={styles.browseLink}>Browse Books</Text>
                        </TouchableOpacity>
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
        fontWeight: "800",
        color: Colors.text,
    },
    subtitle: {
        fontSize: SCREEN_WIDTH * 0.035,
        color: Colors.textSecondary,
        marginTop: 4,
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
        marginBottom: Spacing.md,
    },
    browseLink: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: "600",
    },
});
