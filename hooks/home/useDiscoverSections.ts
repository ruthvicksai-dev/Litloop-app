import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export function useDiscoverSections() {
    const discoverData = useQuery(api.books.getDiscoverData);

    return {
        topPicks: discoverData?.topPicks ?? undefined,
        top10Books: discoverData?.top10Books ?? undefined,
        trendingBooks: discoverData?.trendingBooks ?? undefined,
        newlyAddedBooks: discoverData?.newlyAddedBooks ?? undefined,
        famousBooks: discoverData?.famousBooks ?? undefined,
        seriesBooks: discoverData?.seriesBooks ?? undefined,
    };
}
