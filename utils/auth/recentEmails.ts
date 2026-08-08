import * as SecureStore from "expo-secure-store";

const RECENT_AUTH_EMAILS_KEY = "litloop_recent_auth_emails";
const MAX_RECENT_EMAILS = 5;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

function normalizeEmailList(value: unknown) {
    if (!Array.isArray(value)) {
        return [];
    }

    const emails: string[] = [];
    const seen = new Set<string>();

    for (const item of value) {
        if (typeof item !== "string") {
            continue;
        }

        const email = normalizeEmail(item);
        if (!email || !EMAIL_PATTERN.test(email) || seen.has(email)) {
            continue;
        }

        seen.add(email);
        emails.push(email);

        if (emails.length >= MAX_RECENT_EMAILS) {
            break;
        }
    }

    return emails;
}

export async function getRecentAuthEmails() {
    try {
        const stored = await SecureStore.getItemAsync(RECENT_AUTH_EMAILS_KEY);
        if (!stored) {
            return [];
        }

        return normalizeEmailList(JSON.parse(stored));
    } catch {
        return [];
    }
}

export async function rememberRecentAuthEmail(email: string) {
    try {
        const normalizedEmail = normalizeEmail(email);
        if (!EMAIL_PATTERN.test(normalizedEmail)) {
            return;
        }

        const existingEmails = await getRecentAuthEmails();
        const nextEmails = [
            normalizedEmail,
            ...existingEmails.filter((item) => item !== normalizedEmail),
        ].slice(0, MAX_RECENT_EMAILS);

        await SecureStore.setItemAsync(
            RECENT_AUTH_EMAILS_KEY,
            JSON.stringify(nextEmails)
        );
    } catch {
        // Recent email storage is best-effort and must never block auth.
    }
}
