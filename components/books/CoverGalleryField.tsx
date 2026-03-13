import Button from "@/components/ui/Button";
import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import {
    Image,
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
    return (
        <View style={[styles.coverSection, containerStyle]}>
            <Text style={styles.coverSectionTitle}>Book Covers</Text>
            {coverUris.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                    {coverUris.map((uri, idx) => (
                        <View key={`${uri}-${idx}`} style={styles.coverContainer}>
                            <Image source={{ uri }} style={styles.coverPreview} />
                            <TouchableOpacity
                                style={styles.removeBtn}
                                onPress={() => onRemove(idx)}
                            >
                                <Text style={styles.removeBtnText}>âœ•</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.coverPlaceholder}>
                    <Text style={styles.coverIcon}>ðŸ“š</Text>
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
        </View>
    );
}

const styles = StyleSheet.create({
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
        textAlign: "center",
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
