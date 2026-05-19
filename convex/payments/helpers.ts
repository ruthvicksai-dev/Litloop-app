export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const PAYMENT_RATE_LIMITS = {
    submitUpiPayment: {
        limit: 5,
        windowMs: 15 * 60 * 1000,
        message: "Too many payment submissions. Please try again later.",
    },
    selectCashPayment: {
        limit: 5,
        windowMs: 15 * 60 * 1000,
        message: "Too many payment selections. Please try again later.",
    },
    uploadUrl: {
        limit: 10,
        windowMs: 15 * 60 * 1000,
        message: "Too many upload requests. Please try again later.",
    },
    global: {
        limit: 15,
        windowMs: 30 * 60 * 1000,
        message: "Too many payment requests from this IP. Please try again later.",
    },
} as const;
