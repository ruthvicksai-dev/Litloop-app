import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useState } from "react";

export function useBookDetailsScreen(bookId: string) {
    const book = useQuery(api.books.get, {
        bookId: bookId as Id<"books">,
    });
    const [activeIndex, setActiveIndex] = useState(0);

    return {
        book,
        activeIndex,
        setActiveIndex,
        images:
            book?.coverUrls && book.coverUrls.length > 0
                ? book.coverUrls
                : book?.coverUrl
                    ? [book.coverUrl]
                    : [],
    };
}
