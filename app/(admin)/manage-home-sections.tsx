import AdminHeader from "@/components/admin/core/AdminHeader";
import SearchInput from "@/components/shared/SearchInput";
import BookLoader from "@/components/ui/feedback/BookLoader";
import ConfirmActionModal from "@/components/ui/feedback/ConfirmActionModal";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, scale, moderateScale, Spacing } from "@/constants/theme";
import { Shadows, ModalStyles, Borders } from "@/constants/designTokens";
import { Id } from "@/convex/_generated/dataModel";
import { useManageHomeSections, SectionKey } from "@/hooks";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ─── Constants ────────────────────────────────────────────────────────────── */

const CARD_WIDTH = scale(105);
const COVER_H = CARD_WIDTH * 1.45;

/* ─── Screen ───────────────────────────────────────────────────────────────── */

export default function ManageHomeSectionsScreen() {
    const {
        sections,
        isLoading,
        modalState,
        searchText,
        setSearchText,
        searchResults,
        isSearching,
        openAddModal,
        closeAddModal,
        handleAddBook,
        confirmRemove,
        requestRemoveBook,
        cancelRemove,
        confirmRemoveBook,
        mutating,
        sectionLabels,
    } = useManageHomeSections();

    if (isLoading) {
        return (
            <SafeAreaView style={styles.center}>
                <BookLoader label="Loading sections..." />
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            {/* ─── Header ─────────────────────────────────────────── */}
            <AdminHeader title="Manage Home Sections" variant="dark" />

            {/* ─── Sections ───────────────────────────────────────── */}
            <SafeAreaView style={styles.flex} edges={["bottom", "left", "right"]}>
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {sections.map((section) => (
                        <SectionBlock
                            key={section.key}
                            sectionKey={section.key}
                            label={section.label}
                            slots={section.slots}
                            onAddPress={(position) => {
                                triggerHaptic("light");
                                openAddModal(section.key, position);
                            }}
                            onRemovePress={(bookId: Id<"books">, bookTitle: string) => {
                                triggerHaptic("light");
                                requestRemoveBook(bookId, bookTitle, section.key);
                            }}
                        />
                    ))}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>

            {/* ─── Add Book Modal ──────────────────────────────────── */}
            <AddBookModal
                visible={modalState.visible}
                sectionLabel={sectionLabels[modalState.section]}
                searchText={searchText}
                onChangeSearch={setSearchText}
                results={searchResults}
                isSearching={isSearching}
                onSelectBook={handleAddBook}
                onClose={closeAddModal}
                mutating={mutating}
            />

            {/* ─── Confirm Remove Modal ───────────────────────────── */}
            <ConfirmActionModal
                visible={confirmRemove.visible}
                title="Remove Book"
                message={`Remove "${confirmRemove.bookTitle}" from this section? The book won't be deleted from your library.`}
                confirmLabel="Remove"
                cancelLabel="Cancel"
                onConfirm={confirmRemoveBook}
                onCancel={cancelRemove}
                tone="danger"
                icon="trash-outline"
                loading={mutating}
            />
        </View>
    );
}

/* ─── Section Block Component ──────────────────────────────────────────────── */

type SlotData =
    | { type: "book"; book: any; position: number }
    | { type: "empty"; position: number };

function SectionBlock({
    sectionKey,
    label,
    slots,
    onAddPress,
    onRemovePress,
}: {
    sectionKey: SectionKey;
    label: string;
    slots: SlotData[];
    onAddPress: (position: number) => void;
    onRemovePress: (bookId: Id<"books">, bookTitle: string) => void;
}) {
    const bookCount = slots.filter((s) => s.type === "book").length;

    return (
        <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle} allowFontScaling={false}>
                        {label}
                    </Text>
                    <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText} allowFontScaling={false}>
                            {sectionKey === "top10" ? `${bookCount} / 10` : `${bookCount}`}
                        </Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={slots}
                horizontal
                keyExtractor={(item) =>
                    item.type === "book" ? item.book._id : `empty-${sectionKey}-${item.position}`
                }
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slotList}
                renderItem={({ item }) => {
                    if (item.type === "empty") {
                        return (
                            <EmptySlot
                                position={item.position}
                                onPress={() => onAddPress(item.position)}
                            />
                        );
                    }
                    return (
                        <BookSlot
                            book={item.book}
                            position={item.position}
                            sectionKey={sectionKey}
                            onRemove={() =>
                                onRemovePress(item.book._id, item.book.title)
                            }
                        />
                    );
                }}
            />
        </View>
    );
}

/* ─── Book Slot (existing card + 3-dot remove) ─────────────────────────────── */

function BookSlot({
    book,
    position,
    sectionKey,
    onRemove,
}: {
    book: any;
    position: number;
    sectionKey: SectionKey;
    onRemove: () => void;
}) {
    const [menuVisible, setMenuVisible] = useState(false);
    const cardScale = useRef(new Animated.Value(1)).current;

    const imageUri =
        book.coverUrls && book.coverUrls.length > 0
            ? book.coverUrls[0]
            : book.coverUrl ?? undefined;

    const getRankColors = (rank: number): readonly [string, string] => {
        if (rank === 1) return ["#FFD700", "#FFA500"] as const;
        if (rank === 2) return ["#E5E4E2", "#B4B4B4"] as const;
        if (rank === 3) return ["#CD7F32", "#A0522D"] as const;
        return [Colors.primary, "#8B4513"] as const;
    };

    return (
        <View style={styles.slotCard}>
            <Animated.View style={{ transform: [{ scale: cardScale }] }}>
                <View style={styles.coverWrap}>
                    {imageUri ? (
                        <Image
                            source={imageUri}
                            style={styles.cover}
                            cachePolicy="disk"
                            contentFit="cover"
                        />
                    ) : (
                        <View style={[styles.cover, styles.placeholder]}>
                            <Ionicons name="book" size={scale(28)} color={Colors.primary} />
                        </View>
                    )}

                    {/* Rank badge for Top 10 */}
                    {sectionKey === "top10" && (
                        <LinearGradient
                            colors={getRankColors(position)}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.rankBadge}
                        >
                            <Text style={styles.rankText} allowFontScaling={false}>
                                #{position}
                            </Text>
                        </LinearGradient>
                    )}

                    {/* Position badge for non-top10 */}
                    {sectionKey !== "top10" && (
                        <View style={styles.positionBadge}>
                            <Text style={styles.positionBadgeText} allowFontScaling={false}>
                                #{position}
                            </Text>
                        </View>
                    )}

                    {/* Rating badge */}
                    {book.rating && book.rating > 0 ? (
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={scale(10)} color="#FFD700" />
                            <Text style={styles.ratingText} allowFontScaling={false}>
                                {book.rating.toFixed(1)}
                            </Text>
                        </View>
                    ) : null}

                    {/* 3-dot menu button */}
                    <TouchableOpacity
                        style={styles.menuBtn}
                        activeOpacity={0.7}
                        onPress={() => {
                            triggerHaptic("light");
                            setMenuVisible(true);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="ellipsis-vertical" size={scale(13)} color={Colors.white} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.cardTitle} numberOfLines={2} allowFontScaling={false}>
                    {book.title}
                </Text>
                <Text style={styles.cardAuthor} numberOfLines={1} allowFontScaling={false}>
                    {book.author}
                </Text>
            </Animated.View>

            {/* ─── Remove Menu Overlay ────────────────────────── */}
            <Modal
                visible={menuVisible}
                transparent
                statusBarTranslucent
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable
                    style={styles.menuOverlay}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={styles.menuSheet}>
                        <View style={styles.menuHeader}>
                            <Text style={styles.menuTitle} numberOfLines={1}>
                                {book.title}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.menuItem}
                            activeOpacity={0.7}
                            onPress={() => {
                                setMenuVisible(false);
                                onRemove();
                            }}
                        >
                            <Ionicons name="trash-outline" size={18} color={Colors.error} />
                            <Text style={styles.menuItemTextDanger}>Remove from Section</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

/* ─── Empty Slot Placeholder ───────────────────────────────────────────────── */

function EmptySlot({
    position,
    onPress,
}: {
    position: number;
    onPress: () => void;
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    return (
        <View style={styles.slotCard}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onPress}
                onPressIn={() =>
                    Animated.spring(scaleAnim, {
                        toValue: 0.95,
                        useNativeDriver: true,
                    }).start()
                }
                onPressOut={() =>
                    Animated.spring(scaleAnim, {
                        toValue: 1,
                        friction: 4,
                        useNativeDriver: true,
                    }).start()
                }
            >
                <Animated.View
                    style={[styles.emptySlot, { transform: [{ scale: scaleAnim }] }]}
                >
                    <View style={styles.emptyIconWrap}>
                        <Ionicons name="add" size={scale(22)} color={Colors.primary} />
                    </View>
                    <Text style={styles.emptyText} allowFontScaling={false}>
                        Add Book
                    </Text>
                    <Text style={styles.emptyPosition} allowFontScaling={false}>
                        Position {position}
                    </Text>
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
}

/* ─── Add Book Modal ───────────────────────────────────────────────────────── */

function AddBookModal({
    visible,
    sectionLabel,
    searchText,
    onChangeSearch,
    results,
    isSearching,
    onSelectBook,
    onClose,
    mutating,
}: {
    visible: boolean;
    sectionLabel: string;
    searchText: string;
    onChangeSearch: (text: string) => void;
    results: any[] | undefined;
    isSearching: boolean;
    onSelectBook: (bookId: Id<"books">) => void;
    onClose: () => void;
    mutating: boolean;
}) {
    const renderBookResult = useCallback(
        ({ item }: { item: any }) => {
            const imageUri =
                item.coverUrls && item.coverUrls.length > 0
                    ? item.coverUrls[0]
                    : item.coverUrl ?? undefined;

            return (
                <TouchableOpacity
                    style={styles.resultRow}
                    activeOpacity={0.7}
                    onPress={() => {
                        triggerHaptic("light");
                        onSelectBook(item._id);
                    }}
                    disabled={mutating}
                >
                    {imageUri ? (
                        <Image
                            source={imageUri}
                            style={styles.resultCover}
                            cachePolicy="disk"
                            contentFit="cover"
                        />
                    ) : (
                        <View style={[styles.resultCover, styles.resultCoverPlaceholder]}>
                            <Ionicons name="book-outline" size={18} color={Colors.primary} />
                        </View>
                    )}
                    <View style={styles.resultInfo}>
                        <Text style={styles.resultTitle} numberOfLines={2}>
                            {item.title}
                        </Text>
                        <Text style={styles.resultAuthor} numberOfLines={1}>
                            {item.author}
                        </Text>
                        {item.isbn && (
                            <Text style={styles.resultIsbn} numberOfLines={1}>
                                ISBN: {item.isbn}
                            </Text>
                        )}
                    </View>
                    <View style={styles.resultAddBtn}>
                        <Ionicons name="add-circle" size={20} color={Colors.primary} />
                    </View>
                </TouchableOpacity>
            );
        },
        [onSelectBook, mutating]
    );

    return (
        <Modal
            visible={visible}
            transparent
            statusBarTranslucent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalSheet}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <View style={styles.modalHeaderLeft}>
                            <Ionicons name="library-outline" size={18} color={Colors.primary} />
                            <Text style={styles.modalTitle} numberOfLines={1}>
                                Add Book to {sectionLabel}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={18} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Search Input */}
                    <View style={styles.modalSearchWrap}>
                        <SearchInput
                            value={searchText}
                            onChangeText={onChangeSearch}
                            placeholder="Search by title, author, or ISBN..."
                            containerStyle={styles.modalSearchInput}
                        />
                    </View>

                    {/* Results */}
                    <View style={styles.modalBody}>
                        {!searchText.trim() ? (
                            <View style={styles.modalEmptyState}>
                                <Ionicons
                                    name="search-outline"
                                    size={scale(40)}
                                    color={Colors.textLight}
                                />
                                <Text style={styles.modalEmptyTitle}>Search for a book</Text>
                                <Text style={styles.modalEmptySubtitle}>
                                    Type a title, author, or ISBN to find books
                                </Text>
                            </View>
                        ) : isSearching ? (
                            <View style={styles.modalEmptyState}>
                                <ActivityIndicator size="large" color={Colors.primary} />
                                <Text style={styles.modalEmptyTitle}>Searching...</Text>
                            </View>
                        ) : results && results.length === 0 ? (
                            <View style={styles.modalEmptyState}>
                                <Ionicons
                                    name="book-outline"
                                    size={scale(40)}
                                    color={Colors.textLight}
                                />
                                <Text style={styles.modalEmptyTitle}>No books found</Text>
                                <Text style={styles.modalEmptySubtitle}>
                                    Try a different search term. Books already in this section are hidden.
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={results ?? []}
                                keyExtractor={(item) => item._id}
                                renderItem={renderBookResult}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.resultsList}
                                ItemSeparatorComponent={() => <View style={styles.resultSeparator} />}
                            />
                        )}
                    </View>

                    {/* Loading overlay for mutation */}
                    {mutating && (
                        <View style={styles.mutatingOverlay}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

/* ─── Styles ───────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
    /* Layout */
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    flex: { flex: 1 },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingTop: Spacing.lg,
    },
    headerSafeAreaWrap: {
        backgroundColor: Colors.primaryDark,
    },
    headerSafeArea: {
        backgroundColor: Colors.primaryDark,
    },



    /* Section Block */
    sectionBlock: {
        marginBottom: Spacing.lg,
    },
    sectionHeader: {
        paddingHorizontal: Layout.screenPaddingWide,
        marginBottom: Spacing.sm,
    },
    sectionTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    sectionTitle: {
        fontSize: moderateScale(20),
        color: Colors.primaryDark,
        fontFamily: Fonts.bold,
        letterSpacing: -0.4,
    },
    sectionBadge: {
        backgroundColor: `${Colors.primary}15`,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: 10,
    },
    sectionBadgeText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },

    /* Slot List */
    slotList: {
        paddingLeft: Layout.screenPaddingWide,
        paddingRight: Layout.screenPaddingWide,
        paddingBottom: Spacing.sm,
    },
    slotCard: {
        width: CARD_WIDTH,
        marginRight: Spacing.md,
    },

    /* Book Card (mirrors DiscoverBookCard/Top10BookCard styles) */
    coverWrap: {
        borderRadius: scale(12),
        overflow: "hidden",
        backgroundColor: Colors.primaryLight,
        position: "relative",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
    },
    cover: {
        width: CARD_WIDTH,
        height: COVER_H,
        backgroundColor: Colors.primaryLight,
    },
    placeholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    rankBadge: {
        position: "absolute",
        top: scale(8),
        left: scale(8),
        paddingHorizontal: scale(8),
        paddingVertical: scale(3),
        borderRadius: scale(8),
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.4)",
    },
    rankText: {
        color: Colors.white,
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
        letterSpacing: -0.4,
    },
    positionBadge: {
        position: "absolute",
        top: scale(8),
        left: scale(8),
        backgroundColor: "rgba(0,0,0,0.55)",
        paddingHorizontal: scale(7),
        paddingVertical: scale(2),
        borderRadius: scale(6),
    },
    positionBadgeText: {
        color: Colors.white,
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
    },
    ratingBadge: {
        position: "absolute",
        bottom: scale(6),
        left: scale(6),
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.65)",
        paddingHorizontal: scale(6),
        paddingVertical: scale(2),
        borderRadius: scale(10),
        gap: 3,
    },
    ratingText: {
        fontSize: FontSizes.tiny,
        color: Colors.white,
        fontFamily: Fonts.bold,
    },
    cardTitle: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginTop: scale(6),
        lineHeight: scale(17),
    },
    cardAuthor: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 2,
        marginBottom: Spacing.xs,
    },

    /* 3-dot Menu Button */
    menuBtn: {
        position: "absolute",
        top: scale(6),
        right: scale(6),
        width: scale(22),
        height: scale(22),
        borderRadius: scale(11),
        backgroundColor: "rgba(0,0,0,0.5)",
        alignItems: "center",
        justifyContent: "center",
    },

    /* Menu Overlay */
    menuOverlay: {
        ...ModalStyles.overlay,
    },
    menuSheet: {
        backgroundColor: Colors.surfaceCard,
        borderRadius: 20,
        overflow: "hidden",
        ...Shadows.elevated,
    },
    menuHeader: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        ...Borders.divider,
    },
    menuTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm + 2,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    menuItemTextDanger: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.error,
    },

    /* Empty Slot */
    emptySlot: {
        width: CARD_WIDTH,
        height: COVER_H,
        borderRadius: scale(12),
        borderWidth: 2,
        borderColor: `${Colors.primary}30`,
        borderStyle: "dashed",
        backgroundColor: `${Colors.primary}06`,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyIconWrap: {
        width: scale(36),
        height: scale(36),
        borderRadius: scale(18),
        backgroundColor: `${Colors.primary}12`,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.xs,
    },
    emptyText: {
        fontSize: moderateScale(11),
        fontFamily: Fonts.bold,
        color: Colors.primary,
        marginTop: Spacing.xs,
    },
    emptyPosition: {
        fontSize: moderateScale(9),
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 2,
    },

    /* Add Book Modal */
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(20, 15, 12, 0.35)",
        justifyContent: "flex-end",
    },
    modalSheet: {
        backgroundColor: Colors.surfaceCard,
        borderTopLeftRadius: Layout.cardRadiusLarge + 4,
        borderTopRightRadius: Layout.cardRadiusLarge + 4,
        maxHeight: "85%",
        minHeight: "60%",
        ...Shadows.elevated,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    modalHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        flex: 1,
    },
    modalTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        flex: 1,
    },
    modalCloseBtn: {
        width: scale(28),
        height: scale(28),
        borderRadius: scale(14),
        backgroundColor: Colors.background,
        alignItems: "center",
        justifyContent: "center",
    },
    modalSearchWrap: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
    },
    modalSearchInput: {
        minHeight: scale(46),
    },
    modalBody: {
        flex: 1,
    },

    /* Modal Empty State */
    modalEmptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
    },
    modalEmptyTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginTop: Spacing.md,
    },
    modalEmptySubtitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        textAlign: "center",
        marginTop: Spacing.xs,
        lineHeight: 20,
    },

    /* Results List */
    resultsList: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    resultRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: Spacing.sm + 2,
        gap: Spacing.md,
    },
    resultCover: {
        width: scale(48),
        height: scale(48) * 1.45,
        borderRadius: scale(8),
        backgroundColor: Colors.primaryLight,
    },
    resultCoverPlaceholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    resultInfo: {
        flex: 1,
        justifyContent: "center",
    },
    resultTitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        lineHeight: 19,
    },
    resultAuthor: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    resultIsbn: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.regular,
        color: Colors.textLight,
        marginTop: 2,
    },
    resultAddBtn: {
        padding: Spacing.xs,
    },
    resultSeparator: {
        height: 1,
        backgroundColor: "rgba(0,0,0,0.05)",
    },

    /* Mutating Overlay */
    mutatingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255,255,255,0.7)",
        alignItems: "center",
        justifyContent: "center",
        borderTopLeftRadius: Layout.cardRadiusLarge + 4,
        borderTopRightRadius: Layout.cardRadiusLarge + 4,
    },
});
