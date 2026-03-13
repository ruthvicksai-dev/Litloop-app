import CoverGalleryField from "@/components/books/CoverGalleryField";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Colors, Spacing } from "@/constants/theme";
import { useFadeSlideIn } from "@/hooks/useFadeSlideIn";
import { useEditBookScreen } from "@/hooks/useEditBookScreen";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function EditBookScreen() {
    const { bookId } = useLocalSearchParams<{ bookId: string }>();
    const router = useRouter();
    const { fadeAnim } = useFadeSlideIn({ slideFrom: 0, duration: 400 });
    const {
        book,
        title,
        setTitle,
        author,
        setAuthor,
        description,
        setDescription,
        rentPerDay,
        setRentPerDay,
        totalCopies,
        setTotalCopies,
        coverUris,
        isFetchingCover,
        fetchCover,
        pickImages,
        removeCover,
        loading,
        deleting,
        handleSave,
        handleDelete,
    } = useEditBookScreen(bookId);

    if (book === undefined) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.back}>â† Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Book</Text>
                <TouchableOpacity onPress={handleDelete} disabled={deleting}>
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
            </Animated.View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <InputField label="Title" value={title} onChangeText={setTitle} />
                        <InputField label="Author" value={author} onChangeText={setAuthor} />

                        <CoverGalleryField
                            coverUris={coverUris}
                            onRemove={removeCover}
                            onFetchCover={fetchCover}
                            onPickImages={pickImages}
                            isFetchingCover={isFetchingCover}
                        />

                        <InputField
                            label="Description"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            containerStyle={{ height: 120, marginBottom: Spacing.xl }}
                        />
                        <InputField
                            label="Rent Per Day (â‚¹)"
                            value={rentPerDay}
                            onChangeText={setRentPerDay}
                            keyboardType="number-pad"
                        />
                        <InputField
                            label="Total Copies"
                            value={totalCopies}
                            onChangeText={setTotalCopies}
                            keyboardType="number-pad"
                        />

                        <View style={styles.statsRow}>
                            <Text style={styles.statLabel}>
                                Available Copies: <Text style={styles.statBold}>{book.availableCopies}</Text>
                            </Text>
                            <Text style={styles.statLabel}>
                                Checked Out:{" "}
                                <Text style={styles.statBold}>
                                    {book.totalCopies - book.availableCopies}
                                </Text>
                            </Text>
                        </View>

                        <Button
                            title="Save Changes"
                            onPress={handleSave}
                            loading={loading}
                            style={styles.saveBtn}
                        />
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    flex: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingVertical: Spacing.md,
    },
    back: { fontSize: 16, color: Colors.primary, fontWeight: "600" },
    headerTitle: { fontSize: 18, fontWeight: "800", color: Colors.text },
    deleteText: { fontSize: 15, color: Colors.error, fontWeight: "700" },
    scroll: {
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingTop: Spacing.md,
        paddingBottom: SCREEN_HEIGHT * 0.05,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: Colors.white,
        padding: Spacing.md,
        borderRadius: 12,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statLabel: { fontSize: 13, color: Colors.textSecondary },
    statBold: { fontWeight: "700", color: Colors.primary },
    saveBtn: { marginTop: Spacing.sm },
});
