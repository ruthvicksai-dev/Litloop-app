import BookMetadataFields from "@/components/books/BookMetadataFields";
import CoverGalleryField from "@/components/books/CoverGalleryField";
import FeaturedSectionsFields from "@/components/books/FeaturedSectionsFields";
import FormSectionHeader from "@/components/books/FormSectionHeader";
import GenreSelector from "@/components/books/GenreSelector";
import BookLoader from "@/components/ui/feedback/BookLoader";
import Button from "@/components/ui/core/Button";
import InputField from "@/components/ui/core/InputField";
import KeyboardAwareScrollView from "@/components/ui/core/KeyboardAwareScrollView";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useEditBookScreen, useFadeSlideIn } from "@/hooks";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AdminHeader from "@/components/admin/core/AdminHeader";
import React from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function EditBookScreen() {
    const { bookId } = useLocalSearchParams<{ bookId: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
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
        isSeries,
        toggleSeries,
        series,
        setSeries,
        seriesId,
        setSeriesId,
        seriesList,
        toggleGenre,
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
                <BookLoader label="Loading book..." />
            </View>
        );
    }

    if (book === null) {
        return (
            <View style={styles.container}>
                <AdminHeader title="Edit Book" variant="dark" />
                <SafeAreaView style={styles.flex} edges={["bottom", "left", "right"]}>
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
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Animated.View style={{ opacity: fadeAnim }}>
                <AdminHeader
                    title="Edit Book"
                    variant="dark"
                    rightComponent={
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                onPress={() => router.push({ pathname: "/(admin)/scan-book", params: { source: "edit-book" } })}
                                style={styles.headerIconBtn}
                                accessibilityRole="button"
                                accessibilityLabel="Scan ISBN"
                            >
                                <Ionicons name="barcode-outline" size={22} color={Colors.white} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDelete} disabled={deleting}>
                                <Ionicons name="trash-outline" size={22} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                    }
                />
            </Animated.View>

            <SafeAreaView style={styles.flex} edges={["bottom", "left", "right"]}>
                <KeyboardAwareScrollView
                    contentContainerStyle={[styles.scroll, { paddingTop: Spacing.lg, paddingBottom: Math.max(40, 20 + insets.bottom) }]}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="none"
                >
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <InputField
                            label="Title"
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Book title"
                        />
                        <InputField
                            label="Author"
                            value={author}
                            onChangeText={setAuthor}
                            placeholder="Author name"
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
                            title="Book Series"
                            subtitle="Assign book to a series (optional)."
                        />
                        <FeaturedSectionsFields
                            isSeries={isSeries}
                            series={series}
                            seriesId={seriesId}
                            seriesList={seriesList}
                            onToggleSeries={toggleSeries}
                            onChangeSeries={setSeries}
                            onSelectSeriesId={setSeriesId}
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
                </KeyboardAwareScrollView>
            </SafeAreaView>
        </View>
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
        paddingHorizontal: 20,
        paddingTop: Spacing.md,
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
    },
    headerIconBtn: {
        padding: 2,
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
