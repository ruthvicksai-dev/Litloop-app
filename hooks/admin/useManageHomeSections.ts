import { useAuthState } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useDebouncedValue } from "@/hooks/shared/useDebouncedValue";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useMemo, useRef, useState } from "react";

export type SectionKey = "top10" | "famous" | "trending";

type ModalState = {
    visible: boolean;
    section: SectionKey;
    position: number;
};

const SECTION_LABELS: Record<SectionKey, string> = {
    top10: "Top 10 Books",
    famous: "Famous Books",
    trending: "Trending Books",
};

const MAX_SLOTS = 10;

export function useManageHomeSections() {
    const { accessToken } = useAuthState();
    const { showToast } = useToast();

    // ─── Queries ──────────────────────────────────────────────────────────────
    const sectionData = useQuery(
        api.books.getHomeSectionBooks,
        accessToken ? { accessToken } : "skip"
    );

    // Cache last valid to prevent flicker on re-auth
    const lastValidRef = useRef<typeof sectionData>(undefined);
    if (sectionData !== undefined) {
        lastValidRef.current = sectionData;
    }
    const effectiveData = sectionData ?? lastValidRef.current;

    // ─── Modal State ──────────────────────────────────────────────────────────
    const [modalState, setModalState] = useState<ModalState>({
        visible: false,
        section: "top10",
        position: 1,
    });
    const [searchText, setSearchText] = useState("");
    const debouncedSearch = useDebouncedValue(searchText, 350);

    const searchResults = useQuery(
        api.books.searchBooksForSection,
        accessToken && modalState.visible && debouncedSearch.trim()
            ? {
                accessToken,
                searchText: debouncedSearch,
                section: modalState.section,
            }
            : "skip"
    );

    // ─── Confirm Remove State ─────────────────────────────────────────────────
    const [confirmRemove, setConfirmRemove] = useState<{
        visible: boolean;
        bookId: Id<"books"> | null;
        bookTitle: string;
        section: SectionKey;
    }>({
        visible: false,
        bookId: null,
        bookTitle: "",
        section: "top10",
    });

    // ─── Mutations ────────────────────────────────────────────────────────────
    const addMutation = useMutation(api.books.addBookToSection);
    const removeMutation = useMutation(api.books.removeBookFromSection);
    const [mutating, setMutating] = useState(false);

    // ─── Build slot arrays (books + empty placeholders at correct positions) ──
    const buildSlots = useCallback(
        (books: any[] | undefined, section: SectionKey) => {
            const bookList = books ?? [];

            const posField =
                section === "top10" ? "top10Position" :
                section === "famous" ? "famousPosition" :
                "trendingPosition";

            // Build a position → book map
            const posMap = new Map<number, any>();
            for (const book of bookList) {
                const pos = book[posField];
                if (typeof pos === "number") {
                    posMap.set(pos, book);
                }
            }

            // Find the max occupied position to determine how many slots to show
            const maxOccupied = bookList.length > 0
                ? Math.max(...bookList.map((b) => b[posField] ?? 0))
                : 0;

            // Top 10 always has 10 slots (Positions 1..10)
            // Famous & Trending show at least 3 slots when empty, or maxOccupied + 1 when filled
            const slotCount = section === "top10"
                ? 10
                : Math.max(maxOccupied + 1, bookList.length + 1, 3);

            const slots: Array<{ type: "book"; book: any; position: number } | { type: "empty"; position: number }> = [];

            for (let i = 1; i <= slotCount; i++) {
                const book = posMap.get(i);
                if (book) {
                    slots.push({ type: "book", book, position: i });
                } else {
                    slots.push({ type: "empty", position: i });
                }
            }

            return slots;
        },
        []
    );

    const sections = useMemo(() => {
        const keys: SectionKey[] = ["top10", "famous", "trending"];
        return keys.map((key) => ({
            key,
            label: SECTION_LABELS[key],
            slots: buildSlots(
                effectiveData?.[key],
                key
            ),
        }));
    }, [effectiveData, buildSlots]);

    // ─── Actions ──────────────────────────────────────────────────────────────

    const openAddModal = useCallback((section: SectionKey, position: number) => {
        setSearchText("");
        setModalState({ visible: true, section, position });
    }, []);

    const closeAddModal = useCallback(() => {
        setModalState((prev) => ({ ...prev, visible: false }));
        setSearchText("");
    }, []);

    const handleAddBook = useCallback(
        async (bookId: Id<"books">) => {
            if (!accessToken || mutating) return;
            setMutating(true);
            try {
                await addMutation({
                    accessToken,
                    bookId,
                    section: modalState.section,
                    position: modalState.position,
                });
                showToast("Book added to section.", "success");
                closeAddModal();
            } catch (error: unknown) {
                const message =
                    error instanceof Error ? error.message : "Failed to add book.";
                showToast(message, "error");
            } finally {
                setMutating(false);
            }
        },
        [accessToken, mutating, addMutation, modalState, showToast, closeAddModal]
    );

    const requestRemoveBook = useCallback(
        (bookId: Id<"books">, bookTitle: string, section: SectionKey) => {
            setConfirmRemove({ visible: true, bookId, bookTitle, section });
        },
        []
    );

    const cancelRemove = useCallback(() => {
        setConfirmRemove((prev) => ({ ...prev, visible: false }));
    }, []);

    const confirmRemoveBook = useCallback(async () => {
        if (!accessToken || !confirmRemove.bookId || mutating) return;
        setMutating(true);
        try {
            await removeMutation({
                accessToken,
                bookId: confirmRemove.bookId,
                section: confirmRemove.section,
            });
            showToast("Book removed from section.", "success");
            cancelRemove();
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to remove book.";
            showToast(message, "error");
        } finally {
            setMutating(false);
        }
    }, [accessToken, confirmRemove, mutating, removeMutation, showToast, cancelRemove]);

    return {
        // Data
        sections,
        isLoading: sectionData === undefined && lastValidRef.current === undefined,

        // Add modal
        modalState,
        searchText,
        setSearchText,
        searchResults,
        isSearching: debouncedSearch.trim() !== "" && searchResults === undefined,
        openAddModal,
        closeAddModal,
        handleAddBook,

        // Remove confirm
        confirmRemove,
        requestRemoveBook,
        cancelRemove,
        confirmRemoveBook,

        // Mutation state
        mutating,

        // Labels
        sectionLabels: SECTION_LABELS,
    };
}
