import BookMetadataFields from "@/components/books/BookMetadataFields";
import CoverGalleryField from "@/components/books/CoverGalleryField";
import FeaturedSectionsFields from "@/components/books/FeaturedSectionsFields";
import FormSectionHeader from "@/components/books/FormSectionHeader";
import GenreSelector from "@/components/books/GenreSelector";
import AdminHeader from "@/components/admin/AdminHeader";
import Button from "@/components/ui/core/Button";
import InputField from "@/components/ui/core/InputField";
import { Colors, Spacing } from "@/constants/theme";
import { useAddBookScreen } from "@/hooks";
import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddBookScreen() {
    const {
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
        handleFetchBookInfo,
        handleAddBook,
    } = useAddBookScreen();

    return (
        <SafeAreaView style={styles.container}>
            <AdminHeader title="Add New Book" />
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
                        label="Rent Per Day ₹"
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

                    <FormSectionHeader
                        title="More Details"
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

                    <Button
                        title="Add Book"
                        onPress={handleAddBook}
                        loading={loading}
                        style={{ marginTop: Spacing.md }}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
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
    scroll: {
        flexGrow: 1,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    fetchInfoBtn: {
        marginBottom: Spacing.md,
    },
});
