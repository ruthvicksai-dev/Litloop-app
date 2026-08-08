import AdminHeader from "@/components/admin/core/AdminHeader";
import BookMetadataFields from "@/components/books/BookMetadataFields";
import CoverGalleryField from "@/components/books/CoverGalleryField";
import FeaturedSectionsFields from "@/components/books/FeaturedSectionsFields";
import FormSectionHeader from "@/components/books/FormSectionHeader";
import GenreSelector from "@/components/books/GenreSelector";
import Button from "@/components/ui/core/Button";
import InputField from "@/components/ui/core/InputField";
import KeyboardAwareScrollView from "@/components/ui/core/KeyboardAwareScrollView";
import BookLoader from "@/components/ui/feedback/BookLoader";
import { Colors, Spacing } from "@/constants/theme";
import { useAddBookScreen } from "@/hooks";
import type { AddBookPrefillParams } from "@/hooks/admin/useAddBookScreen";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function AddBookScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams<AddBookPrefillParams>();
    const {
        title,
        setTitle,
        author,
        setAuthor,
        hasFetchedBookInfo,
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
        isFetchingBookInfo,
        toggleGenre,
        coverUris,
        isFetchingCover,
        fetchCover,
        pickImages,
        removeCover,
        loading,
        handleFetchBookInfo,
        handleAddBook,
    } = useAddBookScreen(params);

    // Show full-screen loader when fetching after scan
    const isLoadingFromScan = isFetchingBookInfo && !hasFetchedBookInfo;

    if (isLoadingFromScan) {
        return (
            <View style={styles.container}>
                <AdminHeader title="Add New Book" variant="dark" />
                <SafeAreaView style={styles.flex} edges={["bottom", "left", "right"]}>
                    <View style={styles.center}>
                        <BookLoader label="Fetching book details..." />
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <AdminHeader
                title="Add New Book"
                variant="dark"
                rightComponent={
                    <TouchableOpacity
                        onPress={() => router.replace("/(admin)/scan-book")}
                        accessibilityRole="button"
                        accessibilityLabel="Scan ISBN"
                    >
                        <Ionicons name="barcode-outline" size={22} color={Colors.white} />
                    </TouchableOpacity>
                }
            />
            <SafeAreaView style={styles.flex} edges={["bottom", "left", "right"]}>
                <KeyboardAwareScrollView
                    contentContainerStyle={[
                        styles.scroll,
                        { paddingBottom: Math.max(40, 20 + insets.bottom) },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="none"
                >
                    <InputField
                        label="Title"
                        placeholder="Book title"
                        value={title}
                        onChangeText={setTitle}
                    />
                    <InputField
                        label="Author"
                        placeholder="Author name"
                        value={author}
                        onChangeText={setAuthor}
                    />
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
                        placeholder="Brief description of the book"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                    />
                    <GenreSelector
                        genres={availableGenres}
                        selectedGenres={selectedGenres}
                        onToggleGenre={toggleGenre}
                        helperText="Choose up to 3 main genres."
                    />
                    <InputField
                        label="Rent Per Day (INR)"
                        placeholder="e.g. 10"
                        value={rentPerDay}
                        onChangeText={setRentPerDay}
                        keyboardType="numeric"
                    />
                    <InputField
                        label="Total Copies"
                        placeholder="e.g. 5"
                        value={totalCopies}
                        onChangeText={setTotalCopies}
                        keyboardType="numeric"
                    />

                    <FormSectionHeader title="More Details" />
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

                    <Button
                        title="Add Book"
                        onPress={handleAddBook}
                        loading={loading}
                        style={{ marginTop: Spacing.md }}
                    />
                </KeyboardAwareScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    flex: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    scroll: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
    },
    fetchInfoBtn: {
        marginBottom: Spacing.md,
    },
});
