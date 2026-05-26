import type { BookMetadataExtended } from "../book/metadata";

export type ParsedBookNumericFields = {
    rentPerDay: number;
    totalCopies: number;
    pageCount?: number;
    publishedYear?: number;
    top10Position?: number;
};

function parseOptionalPositiveInt(value: string, label: string) {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`${label} must be a positive whole number.`);
    }
    return parsed;
}

export function parseBookNumericFields(input: {
    rentPerDay: string;
    totalCopies: string;
    pageCount: string;
    publishedYear: string;
    top10Position: string;
    isTop10: boolean;
}) {
    const currentYear = new Date().getFullYear();

    const rent = Number(input.rentPerDay);
    if (!Number.isInteger(rent) || rent <= 0) {
        throw new Error("Rent per day must be a valid positive number.");
    }

    const copies = Number(input.totalCopies);
    if (!Number.isInteger(copies) || copies <= 0) {
        throw new Error("Total copies must be a valid positive number.");
    }

    const pageCount = parseOptionalPositiveInt(input.pageCount, "Page count");
    const publishedYear = parseOptionalPositiveInt(input.publishedYear, "Published year");
    if (publishedYear !== undefined && (publishedYear < 1400 || publishedYear > currentYear + 1)) {
        throw new Error("Published year must be a valid year.");
    }
    const top10Position = input.isTop10
        ? parseOptionalPositiveInt(input.top10Position, "Top 10 position")
        : undefined;

    if (input.isTop10 && (top10Position === undefined || top10Position < 1 || top10Position > 10)) {
        throw new Error("Top 10 position must be between 1 and 10.");
    }

    return {
        rentPerDay: rent,
        totalCopies: copies,
        pageCount,
        publishedYear,
        top10Position,
    } satisfies ParsedBookNumericFields;
}

export function applyMetadataToBookForm(
    metadata: BookMetadataExtended,
    setters: {
        setTitle?: (value: string) => void;
        setAuthor: (value: string) => void;
        setDescription: (value: string) => void;
        setSelectedGenres: (genres: string[]) => void;
        setPageCount: (value: string) => void;
        setPublishedYear: (value: string) => void;
        setPublisher: (value: string) => void;
        setIsbn?: (value: string) => void;
    },
    options: {
        currentTitle?: string;
        currentAuthor: string;
    }
) {
    if (!options.currentTitle?.trim() && metadata.title?.trim()) {
        setters.setTitle?.(metadata.title.trim());
    }

    if (!options.currentAuthor.trim() && metadata.author.trim()) {
        setters.setAuthor(metadata.author.trim());
    }

    if (metadata.description) {
        setters.setDescription(metadata.description);
    }

    if (metadata.genres.length > 0) {
        setters.setSelectedGenres(metadata.genres);
    }

    if (typeof metadata.pageCount === "number" && metadata.pageCount > 0) {
        setters.setPageCount(String(metadata.pageCount));
    }

    if (metadata.publishedYear) {
        setters.setPublishedYear(String(metadata.publishedYear));
    }

    if (metadata.publisher) {
        setters.setPublisher(metadata.publisher);
    }

    if (metadata.isbn) {
        setters.setIsbn?.(metadata.isbn);
    }
}
