import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Colors, Spacing } from "@/constants/theme";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
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
    const { showToast } = useToast();

    const book = useQuery(api.books.get, { bookId: bookId as Id<"books"> });
    const updateBook = useMutation(api.books.update);
    const removeBook = useMutation(api.books.remove);
    const generateUploadUrl = useMutation(api.books.generateUploadUrl);

    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [description, setDescription] = useState("");
    const [rentPerDay, setRentPerDay] = useState("");
    const [totalCopies, setTotalCopies] = useState("");
    const [coverUris, setCoverUris] = useState<string[]>([]);
    const [newImagesSelected, setNewImagesSelected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isFetchingCover, setIsFetchingCover] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (book && !initialized) {
            setTitle(book.title);
            setAuthor(book.author);
            setDescription(book.description);
            setRentPerDay(book.rentPerDay.toString());
            setTotalCopies(book.totalCopies.toString());
            if (book.coverUrls && book.coverUrls.length > 0) {
                setCoverUris(book.coverUrls);
            } else if (book.coverUrl) {
                setCoverUris([book.coverUrl]);
            }
            setInitialized(true);
        }
    }, [book, initialized]);


    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

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

                if (!hasHDCovers && bookInfo?.imageLinks) {
                    let thumbUrl = bookInfo.imageLinks.thumbnail || bookInfo.imageLinks.smallThumbnail;
                    if (thumbUrl) {
                        thumbUrl = thumbUrl.replace(/^http:\/\//i, "https://");
                        urls = [thumbUrl];
                    }
                }

                if (urls.length > 0) {
                    setCoverUris(urls);
                    setNewImagesSelected(true);
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
            setNewImagesSelected(true);
        }
    };

    const handleSave = async () => {
        if (!title.trim() || !author.trim() || !rentPerDay || !totalCopies) {
            showToast("Please fill all required fields.", "error");
            return;
        }

        const rent = parseInt(rentPerDay);
        const copies = parseInt(totalCopies);

        if (isNaN(rent) || rent <= 0) {
            showToast("Rent per day must be a valid positive number.", "error");
            return;
        }
        if (isNaN(copies) || copies <= 0) {
            showToast("Total copies must be a valid positive number.", "error");
            return;
        }

        setLoading(true);
        try {
            let coverImageIds: Id<"_storage">[] | undefined = undefined;

            if (newImagesSelected && coverUris.length > 0) {
                const uploadPromises = coverUris.map(async (uri) => {
                    // If it's already a public URL (from Google or OpenLibrary), we need to download it
                    // If it's a local file (from ImagePicker), fetch(uri) works too
                    const uploadUrl = await generateUploadUrl();
                    const response = await fetch(uri);
                    const blob = await response.blob();
                    const uploadResult = await fetch(uploadUrl, {
                        method: "POST",
                        headers: { "Content-Type": blob.type || "image/jpeg" },
                        body: blob,
                    });
                    const { storageId } = await uploadResult.json();
                    return storageId as Id<"_storage">;
                });
                coverImageIds = await Promise.all(uploadPromises);
            }

            const payload: any = {
                bookId: bookId as Id<"books">,
                title,
                author,
                description,
                rentPerDay: rent,
                totalCopies: copies,
            };

            if (coverImageIds) {
                payload.coverImages = coverImageIds;
            } else if (newImagesSelected && coverUris.length === 0) {
                // Explicitly clear images if they were removed
                payload.coverImages = [];
            }

            await updateBook(payload);

            showToast("Book updated successfully!", "success");
            router.back();
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Book",
            "Are you sure you want to delete this book? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await removeBook({ bookId: bookId as Id<"books"> });
                            showToast("Book deleted safely.", "success");
                            router.replace("/(admin)/books");
                        } catch (error: any) {
                            showToast(error.message, "error");
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

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
                    <Text style={styles.back}>← Back</Text>
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
                        <InputField
                            label="Title"
                            value={title}
                            onChangeText={setTitle}
                        />
                        <InputField
                            label="Author"
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
                                                onPress={() => {
                                                    setCoverUris(prev => prev.filter((_, i) => i !== idx));
                                                    setNewImagesSelected(true);
                                                }}
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
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            containerStyle={{ height: 120, marginBottom: Spacing.xl }}
                        />
                        <InputField
                            label="Rent Per Day (₹)"
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
                                Checked Out: <Text style={styles.statBold}>{book.totalCopies - book.availableCopies}</Text>
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
    coverPreview: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    coverPlaceholder: {
        padding: Spacing.xl,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.border,
        borderStyle: "dashed",
        width: 140,
        height: 200,
        marginBottom: Spacing.md,
    },
    coverIcon: {
        fontSize: 36,
        marginBottom: 8,
    },
    coverText: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: "center"
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

