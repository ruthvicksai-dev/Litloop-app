import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { Fonts, FontSizes } from "@/constants/fonts";
import { SERIES_PAGINATION_OPTS } from "@/constants/pagination";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SeriesItem = {
    _id: Id<"book_series">;
    name: string;
    description?: string;
    coverImage: Id<"_storage">;
    coverUrl?: string | null;
};

export default function SeriesManagementScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { accessToken } = useAuth();
    const seriesQuery = useQuery(api.series.list, {
        paginationOpts: SERIES_PAGINATION_OPTS,
    });
    const seriesList = seriesQuery?.page ?? [];
    const addSeries = useMutation(api.series.add);
    const updateSeries = useMutation(api.series.update);
    const removeSeries = useMutation(api.series.remove);
    const generateUploadUrl = useMutation(api.books.generateUploadUrl);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingSeries, setEditingSeries] = useState<SeriesItem | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [coverUri, setCoverUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const handleOpenModal = (series?: SeriesItem) => {
        if (series) {
            setEditingSeries(series);
            setName(series.name);
            setDescription(series.description || "");
            setCoverUri(series.coverUrl ?? null);
        } else {
            setEditingSeries(null);
            setName("");
            setDescription("");
            setCoverUri(null);
        }
        setModalVisible(true);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [2, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setCoverUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            showToast("Name is required.", "error");
            return;
        }
        if (!coverUri) {
            showToast("Cover image is required.", "error");
            return;
        }

        setLoading(true);
        try {
            let coverImageId: Id<"_storage"> | undefined = editingSeries?.coverImage;

            if (coverUri && !coverUri.startsWith("http")) {
                if (!accessToken) throw new Error("Unauthenticated");
                const uploadUrl = await generateUploadUrl({ accessToken });
                const response = await fetch(coverUri);
                const blob = await response.blob();
                const uploadResult = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": blob.type || "image/jpeg" },
                    body: blob,
                });
                const { storageId } = (await uploadResult.json()) as {
                    storageId: Id<"_storage">;
                };
                coverImageId = storageId;
            }

            if (!coverImageId) {
                showToast("Cover image is required.", "error");
                return;
            }

            if (!accessToken) throw new Error("Unauthenticated");

            if (editingSeries) {
                await updateSeries({
                    accessToken,
                    seriesId: editingSeries._id,
                    name,
                    description,
                    coverImage: coverImageId,
                });
                showToast("Series updated successfully!", "success");
            } else {
                await addSeries({
                    accessToken,
                    name,
                    description,
                    coverImage: coverImageId,
                });
                showToast("Series added successfully!", "success");
            }
            setModalVisible(false);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to save series.";
            showToast(message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: Id<"book_series">) => {
        try {
            if (!accessToken) throw new Error("Unauthenticated");
            await removeSeries({ accessToken, seriesId: id });
            showToast("Series deleted.", "success");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to delete series.";
            showToast(message, "error");
        }
    };

    const renderItem = ({ item }: { item: SeriesItem }) => (
        <View style={styles.card}>
            {item.coverUrl ? (
                <Image source={{ uri: item.coverUrl }} style={styles.cardImage} />
            ) : (
                <View style={styles.cardImageFallback}>
                    <Ionicons name="layers-outline" size={22} color={Colors.textLight} />
                </View>
            )}
            <View style={styles.cardContent}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description || "No description"}
                </Text>
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleOpenModal(item)}
                    >
                        <Ionicons name="pencil" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleDelete(item._id)}
                    >
                        <Ionicons name="trash" size={18} color={Colors.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Book Series</Text>
                <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addBtn}>
                    <Ionicons name="add" size={28} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {seriesQuery === undefined ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={seriesList}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="layers-outline" size={60} color={Colors.textLight} />
                            <Text style={styles.emptyText}>No series created yet.</Text>
                        </View>
                    }
                />
            )}

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <ScrollView
                        contentContainerStyle={styles.modalScroll}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                {editingSeries ? "Edit Series" : "New Series"}
                            </Text>

                            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                                {coverUri ? (
                                    <Image source={{ uri: coverUri }} style={styles.pickedImage} />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <Ionicons name="camera" size={40} color={Colors.textLight} />
                                        <Text style={styles.imagePlaceholderText}>Upload Cover</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <InputField
                                label="Name"
                                placeholder="Series name"
                                value={name}
                                onChangeText={setName}
                            />
                            <InputField
                                label="Description"
                                placeholder="Optional description"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={3}
                            />

                            <View style={styles.modalButtons}>
                                <Button
                                    title="Cancel"
                                    onPress={() => setModalVisible(false)}
                                    variant="secondary"
                                    style={styles.modalBtn}
                                    disabled={loading}
                                />
                                <Button
                                    title="Save"
                                    onPress={handleSave}
                                    loading={loading}
                                    style={styles.modalBtn}
                                />
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: Spacing.md,
    },
    backBtn: { padding: 4 },
    addBtn: { padding: 4 },
    title: {
        fontSize: FontSizes.title,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    list: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        flexDirection: "row",
        backgroundColor: Colors.white,
        borderRadius: 12,
        marginBottom: 16,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardImage: {
        width: 60,
        height: 90,
        borderRadius: 8,
        backgroundColor: Colors.background,
    },
    cardImageFallback: {
        width: 60,
        height: 90,
        borderRadius: 8,
        backgroundColor: Colors.background,
        alignItems: "center",
        justifyContent: "center",
    },
    cardContent: {
        flex: 1,
        marginLeft: 16,
        justifyContent: "space-between",
    },
    cardName: {
        fontSize: FontSizes.bodyLarge,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    cardDesc: {
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        marginTop: 4,
    },
    cardActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 8,
    },
    actionBtn: {
        marginLeft: 16,
        padding: 4,
    },
    empty: {
        alignItems: "center",
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: FontSizes.body,
        color: Colors.textLight,
        fontFamily: Fonts.medium,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalScroll: {
        flexGrow: 1,
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 32,
    },
    modalTitle: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 24,
        textAlign: "center",
    },
    imagePicker: {
        width: "100%",
        maxWidth: 220,
        aspectRatio: 2 / 3,
        borderRadius: 12,
        backgroundColor: Colors.background,
        alignSelf: "center",
        marginBottom: 24,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Colors.border,
        borderStyle: "dashed",
    },
    imagePlaceholder: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    imagePlaceholderText: {
        marginTop: 8,
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.textLight,
    },
    pickedImage: {
        width: "100%",
        height: "100%",
    },
    modalButtons: {
        flexDirection: "row",
        gap: 16,
        marginTop: 24,
    },
    modalBtn: {
        flex: 1,
    },
});
