/**
 * JWT utility functions using Web Crypto API (HMAC-SHA256).
 * No external dependencies — works in Convex runtime.
 */

// ─── Base64url helpers ───────────────────────────────────────────────────────

function base64urlEncode(data: Uint8Array): string {
    const binString = Array.from(data, (byte) =>
        String.fromCharCode(byte)
    ).join("");
    return btoa(binString)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
    // Restore standard base64
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    // Pad if needed
    while (base64.length % 4 !== 0) {
        base64 += "=";
    }
    const binString = atob(base64);
    return Uint8Array.from(binString, (c) => c.charCodeAt(0));
}

// ─── Crypto helpers ──────────────────────────────────────────────────────────

async function getSigningKey(secret: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    return crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );
}

async function sign(data: string, secret: string): Promise<string> {
    const key = await getSigningKey(secret);
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(data)
    );
    return base64urlEncode(new Uint8Array(signature));
}

async function verify(
    data: string,
    signature: string,
    secret: string
): Promise<boolean> {
    const key = await getSigningKey(secret);
    const encoder = new TextEncoder();
    const sigBytes = base64urlDecode(signature);
    return crypto.subtle.verify(
        "HMAC",
        key,
        sigBytes.buffer.slice(sigBytes.byteOffset, sigBytes.byteOffset + sigBytes.byteLength) as ArrayBuffer,
        encoder.encode(data)
    );
}

// ─── JWT Token Payload ───────────────────────────────────────────────────────

export interface JwtPayload {
    /** Subject — the user ID */
    sub: string;
    /** Token type: "access" or "refresh" */
    type: "access" | "refresh";
    /** Issued-at timestamp (ms) */
    iat: number;
    /** Expiration timestamp (ms) */
    exp: number;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Create a signed JWT token.
 *
 * @param payload  - Data to encode (sub, type)
 * @param secret   - HMAC-SHA256 signing secret
 * @param expiresInMs - Token lifetime in milliseconds
 * @returns Signed JWT string (header.payload.signature)
 */
export async function createToken(
    payload: { sub: string; type: "access" | "refresh" },
    secret: string,
    expiresInMs: number
): Promise<string> {
    const encoder = new TextEncoder();

    const header = { alg: "HS256", typ: "JWT" };
    const now = Date.now();

    const fullPayload: JwtPayload = {
        ...payload,
        iat: now,
        exp: now + expiresInMs,
    };

    const headerB64 = base64urlEncode(
        encoder.encode(JSON.stringify(header))
    );
    const payloadB64 = base64urlEncode(
        encoder.encode(JSON.stringify(fullPayload))
    );

    const dataToSign = `${headerB64}.${payloadB64}`;
    const signature = await sign(dataToSign, secret);

    return `${dataToSign}.${signature}`;
}

/**
 * Verify and decode a JWT token.
 *
 * @param token  - The JWT string to verify
 * @param secret - HMAC-SHA256 signing secret
 * @returns The decoded payload
 * @throws Error if the token is malformed, signature is invalid, or token is expired
 */
export async function verifyToken(
    token: string,
    secret: string
): Promise<JwtPayload> {
    const parts = token.split(".");
    if (parts.length !== 3) {
        throw new Error("Malformed token");
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const dataToVerify = `${headerB64}.${payloadB64}`;

    // Verify signature
    const isValid = await verify(dataToVerify, signatureB64, secret);
    if (!isValid) {
        throw new Error("Invalid token signature");
    }

    // Decode payload
    const payloadBytes = base64urlDecode(payloadB64);
    const decoder = new TextDecoder();
    const payload: JwtPayload = JSON.parse(decoder.decode(payloadBytes));

    // Check expiration
    if (payload.exp < Date.now()) {
        throw new Error("Token expired");
    }

    return payload;
}

/**
 * Hash a string using SHA-256 (used to store refresh token hashes in DB).
 */
export async function sha256(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(input)
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
