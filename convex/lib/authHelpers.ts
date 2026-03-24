import { Id } from "../_generated/dataModel";
import { verifyToken } from "./jwt";

// ─── Secret Accessors ────────────────────────────────────────────────────────

/** Returns the secret used to sign/verify access tokens. */
export function getAccessTokenSecret(): string {
    // Falls back to JWT_SECRET for environments that haven't set the split key yet
    const secret = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_ACCESS_SECRET environment variable is not set.");
    }
    return secret;
}

/** Returns the secret used to sign/verify refresh tokens. */
export function getRefreshTokenSecret(): string {
    // Falls back to JWT_SECRET for environments that haven't set the split key yet
    const secret = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_REFRESH_SECRET environment variable is not set.");
    }
    return secret;
}

// ─── Token Verification Helper ───────────────────────────────────────────────

/**
 * Verifies an access token and returns the user ID.
 * Throws if token is invalid, expired, or wrong type.
 */
export async function getUserIdFromAccessToken(
    accessToken: string
): Promise<Id<"users">> {
    const secret = getAccessTokenSecret();
    const payload = await verifyToken(accessToken, secret);
    if (payload.type !== "access") {
        throw new Error("Invalid token type.");
    }
    return payload.sub as Id<"users">;
}

/**
 * Verifies an access token and returns the full user document.
 * Throws if token is invalid or user doesn't exist.
 */
export async function getAuthenticatedUser(
    ctx: { db: any },
    accessToken: string
) {
    const userId = await getUserIdFromAccessToken(accessToken);
    const user = await ctx.db.get(userId);
    if (!user) {
        throw new Error("User not found.");
    }
    return user;
}

/**
 * Verifies that the user associated with the access token has an 'admin' role.
 * Throws if not authenticated or not an admin.
 */
export async function assertAdmin(
    ctx: { db: any },
    accessToken: string
) {
    const user = await getAuthenticatedUser(ctx, accessToken);
    if (user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required.");
    }
    return user;
}

// ─── Password Hashing (PBKDF2 with salt) ────────────────────────────────────

/**
 * Hashes a plaintext password using PBKDF2-SHA256 with a random salt.
 * Returns a self-describing string: `pbkdf2$<salt_hex>$<hash_hex>`.
 *
 * This replaces the old raw SHA-256 approach, which had no salt.
 */
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();

    // Random 16-byte salt
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(saltBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

    // Derive key using PBKDF2 with 100,000 iterations
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: saltBytes,
            iterations: 100_000,
            hash: "SHA-256",
        },
        keyMaterial,
        256
    );

    const hashHex = Array.from(new Uint8Array(derivedBits))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    return `pbkdf2$${saltHex}$${hashHex}`;
}

/**
 * Verifies a plaintext password against a stored hash.
 *
 * Supports both:
 * - New format: `pbkdf2$<salt>$<hash>` (PBKDF2-SHA256 with salt)
 * - Legacy format: raw SHA-256 hex (64 hex chars, no prefix) — for migration
 */
export async function verifyPassword(
    plaintext: string,
    stored: string
): Promise<boolean> {
    const encoder = new TextEncoder();

    if (stored.startsWith("pbkdf2$")) {
        // --- New PBKDF2 path ---
        const parts = stored.split("$");
        if (parts.length !== 3) return false;

        const saltHex = parts[1];
        const storedHashHex = parts[2];

        const saltBytes = new Uint8Array(
            saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16))
        );

        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            encoder.encode(plaintext),
            { name: "PBKDF2" },
            false,
            ["deriveBits"]
        );

        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: "PBKDF2",
                salt: saltBytes,
                iterations: 100_000,
                hash: "SHA-256",
            },
            keyMaterial,
            256
        );

        const inputHashHex = Array.from(new Uint8Array(derivedBits))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        // H2: Timing-safe comparison — prevents timing-based password oracle attacks
        const inputBuf = new Uint8Array(derivedBits);
        const storedBuf = new Uint8Array(
            (storedHashHex.match(/.{2}/g) ?? []).map((h) => parseInt(h, 16))
        );
        if (inputBuf.length !== storedBuf.length) return false;
        let diff = 0;
        for (let i = 0; i < inputBuf.length; i++) diff |= inputBuf[i] ^ storedBuf[i];
        return diff === 0;
    } else {
        // --- Legacy SHA-256 path (no salt) ---
        const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(plaintext));
        const legacyHash = Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        return legacyHash === stored;
    }
}
