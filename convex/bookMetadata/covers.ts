import { fetchWithTimeout } from "./fetchUtils";

type SerpImageResult = {
    original?: string;
    original_width?: number;
    original_height?: number;
    title?: string;
    source?: string;
};

type SerpApiResponse = {
    images_results?: SerpImageResult[];
};

const REJECT_KEYWORDS_REGEX = /\b(logo|avatar|profile|screenshot|banner|placeholder|author|author-photo|author_photo|portrait|headshot|icon|button)\b/i;

/**
 * Stage 1: Validate Open Library Cover using a single GET request.
 * Checks HTTP status, content-type image/*, and minimum body size (5KB).
 */
export async function fetchOpenLibraryCoverCandidate(isbn: string): Promise<string | null> {
    const rawUrl = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg?default=false`;
    const cleanUrl = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg`;

    try {
        const response = await fetchWithTimeout(rawUrl, { method: "GET" }, 8000);

        if (!response.ok) return null;

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.startsWith("image/")) {
            return null;
        }

        const contentLength = response.headers.get("content-length");
        if (contentLength && parseInt(contentLength, 10) < 5120) {
            return null;
        }

        const blob = await response.blob();
        if (blob.size < 5120) {
            return null;
        }

        return cleanUrl;
    } catch {
        return null;
    }
}

/**
 * Stage 2: SerpApi Google Images HD cover fallback (server-side only).
 * Uses process.env.SERPAPI_KEY. Filters candidates strictly.
 */
export async function fetchSerpApiCoverCandidates(
    isbn: string,
    title?: string,
    author?: string
): Promise<string[]> {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
        console.warn("[BookMetadata] SERPAPI_KEY is not set in Convex environment; skipping HD fallback.");
        return [];
    }

    const query = [isbn, title, author, "book cover"].filter(Boolean).join(" ");
    const params = new URLSearchParams({
        engine: "google_images",
        q: query,
        num: "10",
        safe: "active",
        api_key: apiKey,
    });

    try {
        const response = await fetchWithTimeout(
            `https://serpapi.com/search.json?${params.toString()}`,
            { method: "GET" },
            10000
        );

        if (!response.ok) return [];

        const data = (await response.json()) as SerpApiResponse;
        if (!data.images_results || !Array.isArray(data.images_results)) {
            return [];
        }

        const validCandidates: string[] = [];

        for (const item of data.images_results) {
            if (!item.original || typeof item.original !== "string") continue;

            const imgUrl = item.original.trim();
            if (!imgUrl.startsWith("https://")) continue;

            const width = item.original_width ?? 0;
            const height = item.original_height ?? 0;

            // Dimension filtering: min 400px width, min 500px height
            if (width < 400 || height < 500) continue;

            // Aspect ratio filtering: must be portrait (height >= width)
            if (height < width) continue;

            // Reject URLs or titles with unwanted keywords
            const itemTitle = item.title ?? "";
            if (REJECT_KEYWORDS_REGEX.test(imgUrl) || REJECT_KEYWORDS_REGEX.test(itemTitle)) {
                continue;
            }

            validCandidates.push(imgUrl);
            if (validCandidates.length >= 2) break;
        }

        return validCandidates;
    } catch (error: any) {
        console.warn("[BookMetadata] SerpApi cover lookup failed:", error.message);
        return [];
    }
}

/**
 * Complete HD Cover Pipeline:
 * 1. Tries Open Library Cover.
 * 2. If unusable, automatically falls back to SerpApi Google Images.
 */
export async function getCoverCandidates(
    isbn: string,
    title?: string,
    author?: string
): Promise<string[]> {
    const olCover = await fetchOpenLibraryCoverCandidate(isbn);
    if (olCover) {
        return [olCover];
    }

    const serpCovers = await fetchSerpApiCoverCandidates(isbn, title, author);
    return serpCovers;
}
