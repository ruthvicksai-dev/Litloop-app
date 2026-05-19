export const COLLEGE_NAME = "KKR & KSR Institute of Technology and Sciences";
export const REJECTION_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
export const MAX_ID_CARD_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB

export const VERIFICATION_RATE_LIMITS = {
    submit: {
        limit: 3,
        windowMs: 24 * 60 * 60 * 1000,
        message: "You can only submit 3 verification requests per day. Please try again tomorrow.",
    },
    uploadUrl: {
        limit: 5,
        windowMs: 60 * 60 * 1000,
        message: "Too many upload attempts. Please try again later.",
    },
} as const;
