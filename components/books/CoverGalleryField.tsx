import { Fonts, FontSizes } from "@/constants/fonts";
import Button from "@/components/ui/core/Button";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
Image,
    Modal,
    Pressable,
    ScrollView,
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

type CoverGalleryFieldProps = {
    coverUris: string[];
    onRemove: (index: number) => void;
    onFetchCover: () => void;
    onPickImages: () => void;
    isFetchingCover?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
};

export default function CoverGalleryField({
    coverUris,
    onRemove,
    onFetchCover,
    onPickImages,
    isFetchingCover = false,
    containerStyle,
}: CoverGalleryFieldProps) {
    const [previewUri, setPreviewUri] = useState<string | null>(null);

    return (
        <View style={[styles.coverSection, containerStyle]}>
            <Text style={styles.coverSectionTitle}>Book Covers</Text>
            {coverUris.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                    {coverUris.map((uri, idx) => (
                        <View key={`${uri}-${idx}`} style={styles.coverContainer}>
                            <Pressable
                                style={styles.previewTapArea}
                                onPress={() => setPreviewUri(uri)}
                            >
                                <Image source={{ uri }} style={styles.coverPreview} />
                            </Pressable>
                            <TouchableOpacity
                                style={styles.removeBtn}
                                onPress={() => onRemove(idx)}
                            >
                                <Ionicons name="close" size={16} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.coverPlaceholder}>
                    <Ionicons name="images-outline" size={40} color={Colors.border} style={{ marginBottom: 8 }} />
                    <Text style={styles.coverText}>No covers selected</Text>
                </View>
            )}

            <View style={styles.coverActions}>
                <Button
                    title="Fetch Cover"
                    onPress={onFetchCover}
                    loading={isFetchingCover}
                    style={styles.coverActionBtn}
                    variant="secondary"
                />
                <Button
                    title="Upload Images"
                    onPress={onPickImages}
                    style={styles.coverActionBtn}
                    variant="outline"
                />
            </View>

            <Modal
                visible={Boolean(previewUri)}
                transparent
                animationType="fade"
                onRequestClose={() => setPreviewUri(null)}
            >
                <View style={styles.previewOverlay}>
                    <TouchableOpacity
                        style={styles.previewClose}
                        onPress={() => setPreviewUri(null)}
                    >
                        <Ionicons name="close" size={24} color={Colors.white} />
                    </TouchableOpacity>
                    <Pressable
                        style={styles.previewBackdrop}
                        onPress={() => setPreviewUri(null)}
                    >
                        {previewUri ? (
                            <Image
                                source={{ uri: previewUri }}
                                style={styles.previewImage}
                                resizeMode="contain"
                            />
                        ) : null}
                    </Pressable>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    coverSection: {
        marginBottom: Spacing.lg,
    },
    coverSectionTitle: {
        fontSize: FontSizes.bodyLarge,
        fontFamily: Fonts.medium,
        color: Colors.text,
        marginBottom: Spacing.sm,
        marginLeft: 4,
    },
    galleryScroll: {
        marginBottom: Spacing.md,
    },
    coverContainer: {
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Colors.border,
        width: 120,
        aspectRatio: 2 / 3,
        marginRight: Spacing.sm,
        backgroundColor: Colors.surfaceCard,
    },
    previewTapArea: {
        flex: 1,
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
        alignSelf: "stretch",
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.border,
        borderStyle: "dashed",
        minHeight: 200,
        marginBottom: Spacing.md,
    },
    coverIcon: {
        fontSize: FontSizes.display,
        marginBottom: 8,
    },
    coverText: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        textAlign: "center",
        fontFamily: Fonts.regular,
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
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        marginTop: -2,
    },
    coverActions: {
        flexDirection: "row",
        gap: Spacing.sm,
        marginTop: Spacing.xs,
        flexWrap: "wrap",
    },
    coverActionBtn: {
        flex: 1,
        minWidth: 140,
        minHeight: 44,
        paddingVertical: 10,
    },
    previewOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.92)",
    },
    previewClose: {
        position: "absolute",
        top: 56,
        right: 20,
        zIndex: 1,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.45)",
        alignItems: "center",
        justifyContent: "center",
    },
    previewBackdrop: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xl,
    },
    previewImage: {
        width: "100%",
        height: "80%",
    },
});
