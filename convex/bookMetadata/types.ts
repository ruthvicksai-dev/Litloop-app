import { Id } from "../_generated/dataModel";

export type LookupStatus =
    | "SUCCESS"
    | "NOT_FOUND"
    | "PARTIAL_METADATA"
    | "PROVIDER_UNAVAILABLE"
    | "RATE_LIMITED"
    | "INVALID_ISBN"
    | "EXISTING_BOOK";

export type NormalizedBookMetadata = {
    title?: string;
    author: string;
    description: string;
    genres: string[];
    publishedYear: string;
    isbn?: string;
    isbn10?: string;
    isbn13?: string;
    publisher?: string;
    pageCount?: number;
    coverCandidates: string[];
    descriptionRejectedReason?: string;
    sourceProvider: string;
};

export type LookupResult = {
    status: LookupStatus;
    metadata?: NormalizedBookMetadata;
    existingBookId?: Id<"books">;
    existingBookTitle?: string;
    existingBookAuthor?: string;
    message?: string;
};
