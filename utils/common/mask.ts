export function maskEmail(email: string): string {
    const trimmed = email.trim();
    const [localPart = "", domainPart = ""] = trimmed.split("@");

    if (!localPart || !domainPart) {
        return trimmed;
    }

    if (localPart.length <= 2) {
        return `${localPart[0] ?? ""}${"*".repeat(Math.max(1, localPart.length - 1))}@${domainPart}`;
    }

    const firstChar = localPart[0];
    const lastChar = localPart[localPart.length - 1];
    const hiddenLocal = "*".repeat(Math.max(1, localPart.length - 2));

    return `${firstChar}${hiddenLocal}${lastChar}@${domainPart}`;
}
