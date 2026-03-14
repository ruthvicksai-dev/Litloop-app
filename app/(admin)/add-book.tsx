import BookMetadataFields from "@/components/books/BookMetadataFields";
import CoverGalleryField from "@/components/books/CoverGalleryField";
import FeaturedSectionsFields from "@/components/books/FeaturedSectionsFields";
import FormSectionHeader from "@/components/books/FormSectionHeader";
import GenreSelector from "@/components/books/GenreSelector";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useAddBookScreen } from "@/hooks/useAddBookScreen";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddBookScreen() {
    const router = useRouter();
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
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>

                    <Text style={styles.title}>Add New Book</Text>

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
                        onToggleTop10={toggleTop10}
                        onToggleFamous={toggleFamous}
                        onToggleTrending={toggleTrending}
                        onToggleSeries={toggleSeries}
                        onChangeSeries={setSeries}
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
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    backBtn: {
        marginBottom: Spacing.md,
        alignSelf: "flex-start",
        padding: 4,
        marginLeft: -4,
    },
    fetchInfoBtn: {
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: FontSizes.heading,
        color: Colors.text,
        marginBottom: Spacing.lg,
        fontFamily: Fonts.bold,
    },
});
