import BookMetadataFields from "@/components/books/BookMetadataFields";
import CoverGalleryField from "@/components/books/CoverGalleryField";
import FeaturedSectionsFields from "@/components/books/FeaturedSectionsFields";
import FormSectionHeader from "@/components/books/FormSectionHeader";
import GenreSelector from "@/components/books/GenreSelector";
import BookLoader from "@/components/ui/BookLoader";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useEditBookScreen } from "@/hooks/useEditBookScreen";
import { useFadeSlideIn } from "@/hooks/useFadeSlideIn";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
        pageCount,
        setPageCount,
        publishedYear,
        setPublishedYear,
        publisher,
        setPublisher,
        availableGenres,
        selectedGenres,
        isTop10,
        toggleTop10,
        top10Position,
        setTop10Position,
        isFamous,
        toggleFamous,
        isTrending,
        toggleTrending,
        isSeries,
        toggleSeries,
        series,
        setSeries,
        seriesId,
        setSeriesId,
        seriesList,
        isFetchingBookInfo,
        toggleGenre,
        coverUris,
        isFetchingCover,
        fetchCover,
        pickImages,
        removeCover,
        loading,
        deleting,
        handleFetchBookInfo,
        handleSave,
        handleDelete,
    } = useEditBookScreen(bookId);

    if (book === undefined) {
        return (
            <View style={styles.center}>
                <BookLoader label="Loading book..." />
            </View>
        );
    }

    if (book === null) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Book</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={[styles.center, { paddingHorizontal: 40 }]}>
                    <Ionicons
                        name="book-outline"
                        size={60}
                        color={Colors.textLight}
                        style={{ marginBottom: 20 }}
                    />
                    <Text style={styles.notFoundTitle}>Book not found</Text>
                    <Text style={styles.notFoundText}>
                        The book you are looking for does not exist or has been removed.
                    </Text>
                    <Button title="Go Back" onPress={() => router.back()} style={{ width: "100%" }} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Book</Text>
                <TouchableOpacity onPress={handleDelete} disabled={deleting}>
                    <Ionicons name="trash-outline" size={22} color={Colors.error} />
                </TouchableOpacity>
            </Animated.View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <FormSectionHeader
                            title="Book Basics"
                            subtitle="Core details and pricing."
                        />
                        <InputField label="Title" value={title} onChangeText={setTitle} />
                        <InputField label="Author" value={author} onChangeText={setAuthor} />
                        <Button
                            title="Fetch Book Info"
                            onPress={handleFetchBookInfo}
                            loading={isFetchingBookInfo}
                            style={styles.fetchInfoBtn}
                            variant="secondary"
                        />

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
                            containerStyle={{ marginBottom: Spacing.md }}
                        />
                        <GenreSelector
                            genres={availableGenres}
                            selectedGenres={selectedGenres}
                            onToggleGenre={toggleGenre}
                            helperText="Choose up to 3 main genres."
                        />
                        <InputField
                            label="Rent Per Day (INR)"
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

                        <FormSectionHeader
                            title="Book Metadata"
                            subtitle="Auto-filled from APIs and editable."
                        />
                        <BookMetadataFields
                            pageCount={pageCount}
                            publishedYear={publishedYear}
                            publisher={publisher}
                            onChangePageCount={setPageCount}
                            onChangePublishedYear={setPublishedYear}
                            onChangePublisher={setPublisher}
                        />

                        <FormSectionHeader
                            title="Featured Sections"
                            subtitle="Homepage placement controls."
                        />
                        <FeaturedSectionsFields
                            isTop10={isTop10}
                            top10Position={top10Position}
                            isFamous={isFamous}
                            isTrending={isTrending}
                            isSeries={isSeries}
                            series={series}
                            seriesId={seriesId}
                            seriesList={seriesList}
                            onToggleTop10={toggleTop10}
                            onToggleFamous={toggleFamous}
                            onToggleTrending={toggleTrending}
                            onToggleSeries={toggleSeries}
                            onChangeSeries={setSeries}
                            onSelectSeriesId={setSeriesId}
                            onChangeTop10Position={setTop10Position}
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
        paddingHorizontal: 20,
        paddingVertical: Spacing.md,
    },
    backBtn: {
        padding: 4,
        marginLeft: -4,
    },
    headerTitle: {
        fontSize: FontSizes.title,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    notFoundTitle: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 8,
    },
    notFoundText: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        textAlign: "center",
        marginBottom: 24,
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xl,
    },
    fetchInfoBtn: {
        marginBottom: Spacing.md,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: Spacing.sm,
        backgroundColor: Colors.white,
        padding: Spacing.md,
        borderRadius: 12,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statLabel: {
        flex: 1,
        minWidth: 140,
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
    statBold: { fontFamily: Fonts.bold, color: Colors.primary },
    saveBtn: { marginTop: Spacing.sm },
});
