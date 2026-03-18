import { MAIN_GENRES } from "@/constants/mainGenres";
import { BOOKS_PAGINATION_OPTS } from "@/constants/pagination";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";

export function useHomeScreen() {
    const booksQuery = useQuery(api.books.list, {
        paginationOpts: BOOKS_PAGINATION_OPTS,
    });
    const [search, setSearch] = useState("");

    const filteredBooks = useMemo(() => {
        const books = booksQuery?.page ?? [];

        if (!booksQuery) {
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
    }, [booksQuery, search]);

    const genreSections = useMemo(
        () => {
            const dynamicGenres = filteredBooks.flatMap((book) => book.genres ?? []);
            const orderedGenres = Array.from(new Set([...MAIN_GENRES, ...dynamicGenres]));

            return orderedGenres
                .map((genre) => ({
                    genre,
                    books: filteredBooks.filter((book) => (book.genres ?? []).includes(genre)),
                }))
                .filter((section) => section.books.length > 0);
        },
        [filteredBooks]
    );

    return {
        books: booksQuery,
        search,
        setSearch,
        filteredBooks,
        genreSections,
    };
}
