/** Bug report categories available to users. */
export const BUG_CATEGORIES = [
    "App Crash",
    "Login",
    "Authentication",
    "Payment",
    "Book Rental",
    "Delivery",
    "UI / UX",
    "Performance",
    "Notifications",
    "Other",
] as const;

export type BugCategory = (typeof BUG_CATEGORIES)[number];

/** Maps bug categories to GitHub issue labels. */
export const CATEGORY_LABELS: Record<BugCategory, string[]> = {
    "App Crash": ["bug", "critical", "crash"],
    "Login": ["bug", "login", "authentication"],
    "Authentication": ["bug", "authentication"],
    "Payment": ["bug", "payment"],
    "Book Rental": ["bug", "rental"],
    "Delivery": ["bug", "delivery"],
    "UI / UX": ["bug", "ui"],
    "Performance": ["bug", "performance"],
    "Notifications": ["bug", "notifications"],
    "Other": ["bug"],
};

/** Maps categories to default priority. */
export const CATEGORY_PRIORITY: Record<BugCategory, "low" | "medium" | "high" | "critical"> = {
    "App Crash": "critical",
    "Login": "high",
    "Authentication": "high",
    "Payment": "high",
    "Book Rental": "medium",
    "Delivery": "medium",
    "UI / UX": "low",
    "Performance": "medium",
    "Notifications": "low",
    "Other": "low",
};

export const BUG_REPORT_RATE_LIMITS = {
    submit: {
        limit: 5,
        windowMs: 24 * 60 * 60 * 1000,
        message: "You can only submit 5 bug reports per day. Please try again tomorrow.",
    },
    uploadUrl: {
        limit: 10,
        windowMs: 60 * 60 * 1000,
        message: "Too many upload attempts. Please try again later.",
    },
} as const;

export const MAX_SCREENSHOT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Field length limits for validation. */
export const FIELD_LIMITS = {
    title: { min: 5, max: 120 },
    description: { min: 10, max: 2000 },
    steps: { max: 1500 },
    expected: { max: 1000 },
    actual: { max: 1000 },
} as const;
