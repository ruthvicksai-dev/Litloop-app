import BookLoader from "@/components/ui/BookLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import RentalCard from "@/components/ui/RentalCard";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { useFadeSlideIn } from "@/hooks";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import {
    Animated,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyRentalsScreen() {
    const { userId } = useAuth();
    const rentals = useQuery(api.rentals.getUserRentals, userId ? { userId } : "skip");
    const router = useRouter();
    const { fadeAnim, slideAnim } = useFadeSlideIn();

    if (rentals === undefined) {
        return (
            <View style={styles.center}>
                <BookLoader label="Loading rentals..." />
            </View>
        );
    }

    const handleRentalPress = (rental: (typeof rentals)[number]) => {
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
                            coverUrl={item.coverUrl || item.book?.coverUrl}
                            status={item.status}
                            deliveryDate={item.deliveryDate}
                            deliveryTime={item.deliveryTime}
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
                    <View style={styles.emptyWrapper}>
                        <EmptyState
                            icon="clipboard-outline"
                            title="No active rentals"
                        />
                        <TouchableOpacity style={styles.browseBtn} onPress={() => router.push("/(tabs)")}>
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
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: FontSizes.heading,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    subtitle: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
        fontFamily: Fonts.regular,
    },
    list: {
        flexGrow: 1,
        paddingHorizontal: Layout.screenPaddingWide,
        paddingBottom: Layout.touchSize * 2,
    },
    emptyWrapper: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    browseBtn: {
        marginTop: -Spacing.md,
    },
    browseLink: {
        fontSize: FontSizes.subtitle,
        color: Colors.primary,
        fontFamily: Fonts.medium,
    },
});
