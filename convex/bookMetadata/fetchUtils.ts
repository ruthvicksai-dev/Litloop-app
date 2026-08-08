/**
 * Server-side HTTP fetch utilities with AbortController timeout and retry logic.
 */

export class FetchError extends Error {
    constructor(
        message: string,
        public status?: number,
        public isTransient: boolean = false
    ) {
        super(message);
        this.name = "FetchError";
    }
}

export type RetryConfig = {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    jitterMs?: number;
};

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 5000,
    jitterMs: 500,
};

/**
 * Fetch wrapper with timeout using AbortController.
 */
export async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = 10000
): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } catch (error: any) {
        if (error.name === "AbortError") {
            throw new FetchError(`Request timed out after ${timeoutMs}ms`, undefined, true);
        }
        throw new FetchError(`Network error: ${error.message}`, undefined, true);
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Executes a fetch request with exponential backoff and jitter.
 * Retries ONLY transient errors (429, 502, 503, 504, timeout, network error).
 * DOES NOT retry 400, 401, 403, 404, or other permanent client errors.
 */
export async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = 10000,
    retryConfig: RetryConfig = {}
): Promise<Response> {
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    let attempt = 0;

    while (attempt < config.maxAttempts) {
        attempt++;
        try {
            const response = await fetchWithTimeout(url, options, timeoutMs);

            if (response.ok) {
                return response;
            }

            const status = response.status;
            // 404 is not a system failure — it means resource does not exist
            if (status === 404) {
                return response;
            }

            // Check if status is transient (429 or 5xx)
            const isTransient = status === 429 || (status >= 500 && status <= 599);

            if (!isTransient || attempt >= config.maxAttempts) {
                throw new FetchError(`HTTP error ${status}`, status, isTransient);
            }

            // Calculate backoff delay with jitter
            const backoff = Math.min(
                config.baseDelayMs * Math.pow(2, attempt - 1),
                config.maxDelayMs
            );
            const jitter = Math.random() * config.jitterMs;
            const delay = backoff + jitter;

            await new Promise((resolve) => setTimeout(resolve, delay));
        } catch (error: any) {
            const isTransient = error instanceof FetchError ? error.isTransient : true;

            if (!isTransient || attempt >= config.maxAttempts) {
                throw error;
            }

            const backoff = Math.min(
                config.baseDelayMs * Math.pow(2, attempt - 1),
                config.maxDelayMs
            );
            const jitter = Math.random() * config.jitterMs;
            const delay = backoff + jitter;

            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw new FetchError(`Request failed after ${config.maxAttempts} attempts`, undefined, true);
}

export function logLookupEvent(event: {
    lookupId: string;
    isbn: string;
    provider: string;
    durationMs: number;
    status: number | string;
    success: boolean;
    fallbackUsed?: string;
    errorCategory?: string;
}) {
    console.log(
        `[BookLookup] id=${event.lookupId} isbn=${event.isbn} provider=${event.provider} ` +
        `status=${event.status} success=${event.success} duration=${event.durationMs}ms` +
        (event.fallbackUsed ? ` fallback=${event.fallbackUsed}` : "") +
        (event.errorCategory ? ` error=${event.errorCategory}` : "")
    );
}
