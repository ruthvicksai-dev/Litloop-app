import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fetchBookMetadata } from "../../../utils/book/metadata";

// Mock the global fetch API
const globalFetchMock = vi.fn();
vi.stubGlobal("fetch", globalFetchMock);

describe("Book Metadata Utils", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("fetchBookMetadata", () => {
        it("should parse and return book metadata from a successful Google Books response", async () => {
            // Mock a successful Google Books response with ALL fields so it doesn't trigger fallback
            globalFetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    items: [
                        {
                            volumeInfo: {
                                title: "Mocked Book Title",
                                authors: ["Mock Author"],
                                description: "A mocked description.",
                                categories: ["Action"],
                                publishedDate: "2023",
                                publisher: "Mock Publisher",
                                pageCount: 200,
                            },
                        },
                    ],
                }),
            });

            const result = await fetchBookMetadata("Mocked Book Title");
            
            expect(globalFetchMock).toHaveBeenCalledTimes(1);
            expect(result.title).toBe("Mocked Book Title");
            expect(result.author).toBe("Mock Author");
            expect(result.description).toBe("A mocked description.");
            expect(result.genres).toContain("Action");
            expect(result.publishedYear).toBe("2023");
        });

        it("should retry and eventually throw a user-friendly error on a 429 Too Many Requests response", async () => {
            // The fetchWithRetry function loops exactly 3 times before failing
            const mock429Response = {
                ok: false,
                status: 429,
                json: async () => ({ error: "Too Many Requests" }),
            };
            
            globalFetchMock
                .mockResolvedValueOnce(mock429Response)
                .mockResolvedValueOnce(mock429Response)
                .mockResolvedValueOnce(mock429Response);
            
            // Mock the OpenLibrary fallback to SUCCEED but return NO data.
            // If OpenLibrary throws an error, the code throws a generic connection error.
            globalFetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ docs: [] }),
            });

            await expect(fetchBookMetadata("Test Title"))
                .rejects
                .toThrow("API rate limit exceeded and book not found in fallback database.");
            
            // Google Books is called 3 times due to retry logic
            // Plus OpenLibrary is called once as fallback
            expect(globalFetchMock).toHaveBeenCalledTimes(4);
        });

        it("should fallback to OpenLibrary if Google Books returns partial data (no author)", async () => {
            // Mock Google Books returning data BUT no author
            globalFetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    items: [
                        {
                            volumeInfo: {
                                title: "Google Title",
                                // Notice: no authors array
                                description: "Google Description",
                                categories: ["Science"],
                                publishedDate: "2023",
                                publisher: "Google Publisher",
                                pageCount: 300
                            },
                        },
                    ],
                }),
            });

            // Mock OpenLibrary fallback returning the missing author
            globalFetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    docs: [
                        {
                            author_name: ["OpenLibrary Author"],
                        },
                    ],
                }),
            });

            const result = await fetchBookMetadata("Google Title");
            
            // Title and Description come from Google
            expect(result.title).toBe("Google Title");
            expect(result.description).toBe("Google Description");
            // Author comes from OpenLibrary fallback
            expect(result.author).toBe("OpenLibrary Author");
            
            // Verifying both APIs were hit (Google + OL Search for title)
            expect(globalFetchMock).toHaveBeenCalledTimes(2);
        });
    });
});
