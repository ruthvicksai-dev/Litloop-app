import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Colors, Spacing } from "@/constants/theme";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddBookScreen() {
    const { showToast } = useToast();
    const router = useRouter();
    const addBook = useMutation(api.books.add);
    const generateUploadUrl = useMutation(api.books.generateUploadUrl);

    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [description, setDescription] = useState("");
    const [rentPerDay, setRentPerDay] = useState("");
    const [totalCopies, setTotalCopies] = useState("");
    const [coverUris, setCoverUris] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFetchingCover, setIsFetchingCover] = useState(false);

    const fetchCover = async () => {
        if (!title.trim()) {
            showToast("Please enter a title to fetch cover.", "error");
            return;
        }

        setIsFetchingCover(true);
        try {
            const query = `intitle:${encodeURIComponent(title.trim())}`;
            const authorQuery = author.trim() ? `+inauthor:${encodeURIComponent(author.trim())}` : "";
            const url = `https://www.googleapis.com/books/v1/volumes?q=${query}${authorQuery}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                const bookInfo = data.items[0].volumeInfo;

                let isbn = "";
                if (bookInfo.industryIdentifiers) {
                    const isbn13 = bookInfo.industryIdentifiers.find((id: any) => id.type === "ISBN_13");
                    const isbn10 = bookInfo.industryIdentifiers.find((id: any) => id.type === "ISBN_10");
                    isbn = isbn13?.identifier || isbn10?.identifier || "";
                }

                let urls: string[] = [];
                let hasHDCovers = false;

                if (isbn) {
                    // Test if OpenLibrary has the cover by using default=false which returns 404 if missing
                    const testUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`;
                    try {
                        const res = await fetch(testUrl);
                        if (res.ok) {
                            urls = [
                                `https://covers.openlibrary.org/b/isbn/${isbn}-S.jpg`,
                                `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
                                `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
                            ];
                            hasHDCovers = true;
                        }
                    } catch (e) {
                        console.log("OpenLibrary cover fetch skipped", e);
                    }
                }

                // Fallback to Google Books thumbnail if OpenLibrary fails
                if (!hasHDCovers && bookInfo?.imageLinks) {
                    let thumbUrl = bookInfo.imageLinks.thumbnail || bookInfo.imageLinks.smallThumbnail;
                    if (thumbUrl) {
                        thumbUrl = thumbUrl.replace(/^http:\/\//i, "https://");
                        urls = [thumbUrl];
                    }
                }

                if (urls.length > 0) {
                    setCoverUris(urls);
                    showToast("Book cover(s) fetched successfully!", "success");
                    return;
                }
            }

            showToast("No cover found. Please upload manually.", "error");
        } catch (error) {
            showToast("Failed to fetch cover. Check your connection.", "error");
        } finally {
            setIsFetchingCover(false);
        }
    };

    const pickImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });
        if (!result.canceled && result.assets.length > 0) {
            setCoverUris(result.assets.map(a => a.uri));
        }
    };

    const handleAddBook = async () => {
        if (!title.trim()) {
            showToast("Title is required.", "error");
            return;
        }
        if (!author.trim()) {
            showToast("Author is required.", "error");
            return;
        }
        if (!rentPerDay || Number(rentPerDay) <= 0) {
            showToast("Valid rent per day is required.", "error");
            return;
        }
        if (!totalCopies || Number(totalCopies) <= 0) {
            showToast("Valid total copies is required.", "error");
            return;
        }

        setLoading(true);
        try {
            let coverImages: string[] = [];

            if (coverUris.length > 0) {
                const uploadPromises = coverUris.map(async (uri) => {
                    const uploadUrl = await generateUploadUrl();
                    const response = await fetch(uri);
                    const blob = await response.blob();
                    const uploadResult = await fetch(uploadUrl, {
                        method: "POST",
                        headers: { "Content-Type": blob.type || "image/jpeg" },
                        body: blob,
                    });
                    const { storageId } = await uploadResult.json();
                    return storageId;
                });

                coverImages = await Promise.all(uploadPromises);
            }

            await addBook({
                title,
                author,
                description,
                rentPerDay: Number(rentPerDay),
                totalCopies: Number(totalCopies),
                coverImages: coverImages.length > 0 ? (coverImages as Id<"_storage">[]) : undefined,
            });

            showToast("Book added successfully!", "success");
            router.back();
        } catch (error: any) {
            showToast(error.message || "Failed to add book.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>← Back</Text>
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

                {/* Cover Image Section */}
                <View style={styles.coverSection}>
                    <Text style={styles.coverSectionTitle}>Book Covers</Text>
                    {coverUris.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                            {coverUris.map((uri, idx) => (
                                <View key={idx} style={styles.coverContainer}>
                                    <Image source={{ uri }} style={styles.coverPreview} />
                                    <TouchableOpacity
                                        style={styles.removeBtn}
                                        onPress={() => setCoverUris(prev => prev.filter((_, i) => i !== idx))}
                                    >
                                        <Text style={styles.removeBtnText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.coverPlaceholder}>
                            <Text style={styles.coverIcon}>📚</Text>
                            <Text style={styles.coverText}>No covers selected</Text>
                        </View>
                    )}

                    <View style={styles.coverActions}>
                        <Button
                            title="Fetch Cover"
                            onPress={fetchCover}
                            loading={isFetchingCover}
                            style={styles.coverActionBtn}
                            variant="secondary"
                        />
                        <Button
                            title="Upload Images"
                            onPress={pickImages}
                            style={styles.coverActionBtn}
                            variant="outline"
                        />
                    </View>
                </View>

                <InputField
                    label="Description"
                    placeholder="Brief description of the book"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                />
                <InputField
                    label="Rent Per Day (₹)"
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
    backText: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: "600",
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: Colors.text,
        marginBottom: Spacing.lg,
    },
    coverPreview: {
        width: "100%",
        height: 200,
        resizeMode: "cover",
    },
    coverPlaceholder: {
        padding: Spacing.xl,
        alignItems: "center",
        justifyContent: "center",
    },
    coverIcon: {
        fontSize: 36,
        marginBottom: 8,
    },
    coverText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    coverSection: {
        marginBottom: Spacing.lg,
    },
    coverSectionTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: Colors.text,
        marginBottom: Spacing.sm,
        marginLeft: 4,
    },
    galleryScroll: {
        flexDirection: "row",
        marginBottom: Spacing.md,
    },
    coverContainer: {
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Colors.border,
        width: 120,
        height: 180,
        marginRight: Spacing.sm,
        backgroundColor: Colors.white,
    },
    removeBtn: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "rgba(0,0,0,0.6)",
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    removeBtnText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: "bold",
        marginTop: -2,
    },
    coverActions: {
        flexDirection: "row",
        gap: Spacing.sm,
        marginTop: Spacing.xs,
    },
    coverActionBtn: {
        flex: 1,
        minHeight: 44,
        paddingVertical: 10,
    },
});
