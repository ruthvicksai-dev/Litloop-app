import { createRemoteJWKSet, jwtVerify } from "jose";

const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Isolate-level cache
let cachedJWKS: ReturnType<typeof createRemoteJWKSet> | null = null;
let lastFetchTime = 0;

function getJWKS() {
    const now = Date.now();
    if (!cachedJWKS || now - lastFetchTime > CACHE_TTL) {
        cachedJWKS = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));
        lastFetchTime = now;
    }
    return cachedJWKS;
}

export interface GooglePayload {
    email: string;
    email_verified: boolean;
    name: string;
    picture?: string;
    sub: string;
}

/**
 * Verifies a Google ID token with hardened validation and JWKS caching.
 */
export async function verifyGoogleIdToken(
    idToken: string,
    clientId: string
): Promise<GooglePayload> {
    try {
        const { payload } = await jwtVerify(idToken, getJWKS(), {
            issuer: GOOGLE_ISSUERS,
            audience: clientId,
        });

        if (!payload.email || typeof payload.email !== "string") {
            console.warn("[Auth] Google token missing email", { sub: payload.sub });
            throw new Error("Token payload is missing email");
        }

        if (payload.email_verified !== true) {
            console.warn("[Auth] Google email not verified", { email: payload.email });
            throw new Error("Google email is not verified");
        }

        // Issuer hardening (redundant with jose options but good for explicit safety)
        if (!payload.iss || !GOOGLE_ISSUERS.includes(payload.iss)) {
            console.error("[Auth] Invalid issuer", { iss: payload.iss });
            throw new Error("Invalid token issuer");
        }

        return {
            email: payload.email.toLowerCase().trim(),
            email_verified: payload.email_verified,
            name: (payload.name as string) || "User", // Safe fallback
            picture: payload.picture as string | undefined,
            sub: payload.sub as string,
        };
    } catch (error: any) {
        console.warn("[Auth] Google token verification failed", {
            reason: error.message,
            code: error.code
        });
        throw new Error("Authentication failed: Invalid Google token");
    }
}
