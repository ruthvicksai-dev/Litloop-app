export function normalizePhoneNumber(value: string) {
    const digits = value.replace(/\D/g, "");

    if (digits.length === 12 && digits.startsWith("91")) {
        return digits.slice(2);
    }

    return digits;
}

export function getPhoneValidationError(value: string, label = "Phone number") {
    const normalized = normalizePhoneNumber(value);

    if (!normalized) {
        return `${label} is required.`;
    }

    if (!/^[6-9]\d{9}$/.test(normalized)) {
        return `Enter a valid ${label.toLowerCase()}.`;
    }

    return null;
}
