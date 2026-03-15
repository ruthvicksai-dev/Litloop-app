import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export function useDiscoverSections() {
    const topPicks = useQuery(api.books.getTopPicks);
    const top10Books = useQuery(api.books.getTop10Books);
    const trendingBooks = useQuery(api.books.getTrendingBooks);
    const newlyAddedBooks = useQuery(api.books.getNewlyAddedBooks);
    const famousBooks = useQuery(api.books.getFamousBooks);
    const seriesBooks = useQuery(api.books.getSeriesBooks);

    return {
        topPicks,
        top10Books,
        trendingBooks,
        newlyAddedBooks,
        famousBooks,
        seriesBooks,
    };
}
