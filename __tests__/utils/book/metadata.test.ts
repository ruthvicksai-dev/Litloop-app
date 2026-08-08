import { describe, expect, it } from "vitest";
import { normalizeIsbn, validateIsbn, validateIsbn10, validateIsbn13, isbnToIsbn13 } from "../../../convex/bookMetadata/isbn";
import { cleanDescriptionText, extractMainGenres, getPublishedYear, sanitizeFetchedDescription } from "../../../convex/bookMetadata/normalize";

describe("Book Metadata Server-Side Utilities", () => {
    describe("ISBN Normalization & Check-Digit Validation", () => {
        it("should normalize raw ISBN strings with hyphens and spaces", () => {
            expect(normalizeIsbn(" 978-0-13-468599-1 ")).toBe("9780134685991");
            expect(normalizeIsbn("0-306-40615-2")).toBe("0306406152");
            expect(normalizeIsbn("080442957x")).toBe("080442957X");
        });

        it("should handle UPC-A barcodes by prefixing 0 to make a 13-digit EAN", () => {
            expect(normalizeIsbn("123456789012")).toBe("0123456789012");
        });

        it("should validate ISBN-10 check digits correctly", () => {
            expect(validateIsbn10("0306406152")).toBe(true);
            expect(validateIsbn10("080442957X")).toBe(true);
            expect(validateIsbn10("0306406153")).toBe(false);
        });

        it("should validate ISBN-13 check digits correctly", () => {
            expect(validateIsbn13("9780134685991")).toBe(true);
            expect(validateIsbn13("9780306406157")).toBe(true);
            expect(validateIsbn13("9780134685992")).toBe(false);
        });

        it("should validate raw ISBN inputs", () => {
            expect(validateIsbn("978-0134685991")).toEqual({ isValid: true, type: "ISBN-13" });
            expect(validateIsbn("0-306-40615-2")).toEqual({ isValid: true, type: "ISBN-10" });
            expect(validateIsbn("123456789")).toEqual({ isValid: false, type: undefined });
        });

        it("should convert valid ISBN-10 to ISBN-13", () => {
            expect(isbnToIsbn13("0306406152")).toBe("9780306406157");
        });
    });

    describe("Metadata Normalization & Sanitization", () => {
        it("should clean HTML tags and entities from descriptions", () => {
            const raw = "<p>This is a <b>great</b> book &amp; a fast read.&nbsp;</p>";
            expect(cleanDescriptionText(raw)).toBe("This is a great book & a fast read.");
        });

        it("should extract main genres from raw category lists (max 3)", () => {
            const rawCategories = ["Science Fiction", "Thriller", "Action & Adventure", "Crime", "Romance"];
            const extracted = extractMainGenres(rawCategories);
            expect(extracted).toContain("Sci-Fi");
            expect(extracted).toContain("Thriller");
            expect(extracted.length).toBeLessThanOrEqual(3);
        });

        it("should extract 4-digit published year", () => {
            expect(getPublishedYear("October 15, 2021")).toBe("2021");
            expect(getPublishedYear("2019-05-01")).toBe("2019");
            expect(getPublishedYear("invalid")).toBe("");
        });

        it("should sanitize description and reject non-English text", () => {
            const spanishLongText = "Este es un libro en español que describe una gran aventura para todos los lectores de la comunidad y del mundo entero sin excepciones.";
            const result = sanitizeFetchedDescription(spanishLongText);
            expect(result.description).toBe("");
            expect(result.rejectedReason).toBeDefined();
        });
    });
});
