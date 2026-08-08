/**
 * Server-side ISBN normalization and validation utilities.
 * Handles ISBN-10, ISBN-13, and UPC-A (prefixing '0').
 */

export function normalizeIsbn(raw: string): string {
    let clean = raw.replace(/[\s-]/g, "").trim().toUpperCase();

    // UPC-A (12 digits) scanning handling: prefix with '0' if it converts to an ISBN-13/EAN-13 candidate
    if (/^\d{12}$/.test(clean)) {
        clean = "0" + clean;
    }

    return clean;
}

export function validateIsbn10(isbn10: string): boolean {
    const clean = isbn10.trim().toUpperCase();
    if (!/^\d{9}[\dX]$/.test(clean)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(clean[i], 10) * (10 - i);
    }
    const lastChar = clean[9];
    const checkValue = lastChar === "X" ? 10 : parseInt(lastChar, 10);
    sum += checkValue;

    return sum % 11 === 0;
}

export function validateIsbn13(isbn13: string): boolean {
    const clean = isbn13.trim();
    if (!/^\d{13}$/.test(clean)) return false;

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(clean[i], 10);
        sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(clean[12], 10);
}

export function validateIsbn(isbn: string): { isValid: boolean; type?: "ISBN-10" | "ISBN-13" } {
    const normalized = normalizeIsbn(isbn);

    if (normalized.length === 10) {
        const isValid = validateIsbn10(normalized);
        return { isValid, type: isValid ? "ISBN-10" : undefined };
    }

    if (normalized.length === 13) {
        const isValid = validateIsbn13(normalized);
        return { isValid, type: isValid ? "ISBN-13" : undefined };
    }

    return { isValid: false };
}

export function isbnToIsbn13(isbn10: string): string | null {
    const clean = normalizeIsbn(isbn10);
    if (clean.length !== 10 || !validateIsbn10(clean)) return null;

    const base = "978" + clean.substring(0, 9);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(base[i], 10);
        sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return base + checkDigit;
}
