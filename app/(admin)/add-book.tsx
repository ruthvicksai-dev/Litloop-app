import CoverGalleryField from "@/components/books/CoverGalleryField";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Colors, Spacing } from "@/constants/theme";
import { useAddBookScreen } from "@/hooks/useAddBookScreen";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Fonts } from "@/constants/fonts";
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
        coverUris,
        isFetchingCover,
        fetchCover,
        pickImages,
        removeCover,
        loading,
        handleAddBook,
    } = useAddBookScreen();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
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
                    placeholder="Author name (optional for search)"
                    value={author}
                    onChangeText={setAuthor}
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

                <Button
                    title="Add Book"
                    onPress={handleAddBook}
                    loading={loading}
                    style={{ marginTop: Spacing.md }}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scroll: {
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
    backText: {
        fontSize: 16,
        color: Colors.primary,
        fontFamily: Fonts.medium,
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: 24,
        
        color: Colors.text,
        marginBottom: Spacing.lg,
      fontFamily: Fonts.bold,
    },
});
