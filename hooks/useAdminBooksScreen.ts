import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";

export function useAdminBooksScreen() {
    const books = useQuery(api.books.list);
    const [search, setSearch] = useState("");

    const filteredBooks = useMemo(() => {
        if (!books) {
            return [];
        }

        if (!search.trim()) {
            return books;
        }

        const query = search.toLowerCase();
        return books.filter(
            (book) =>
                book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query)
        );
    }, [books, search]);

    return {
        books,
        search,
        setSearch,
        filteredBooks,
    };
}
