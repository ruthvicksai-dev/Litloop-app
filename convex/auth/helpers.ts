import { Id } from "../_generated/dataModel";
import { getAccessTokenSecret, getRefreshTokenSecret } from "../lib/authHelpers";
import { createToken, sha256 } from "../lib/jwt";

export function getAccessTokenExpiryMs(): number {
    const minutes = parseInt(
        process.env.ACCESS_TOKEN_EXPIRY_MINUTES ?? "30",
        10
    );
    return minutes * 60 * 1000;
}

export function getRefreshTokenExpiryMs(): number {
    const days = parseInt(
        process.env.REFRESH_TOKEN_EXPIRY_DAYS ?? "10",
        10
    );
    return days * 24 * 60 * 60 * 1000;
}

export function normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "");
}

export function isSessionRevoked(
    session: { isRevoked?: boolean } | null | undefined
): boolean {
    return session?.isRevoked ?? false;
}

export function getSessionRefreshTokenHash(
    session: { refreshTokenHash?: string; tokenHash?: string } | null | undefined
): string | undefined {
    return session?.refreshTokenHash ?? session?.tokenHash;
}

export const AUTH_RATE_LIMITS = {
    signUp: {
        limit: 5,
        windowMs: 30 * 60 * 1000,
        message: "Too many sign-up attempts. Please try again later.",
    },
    signIn: {
        limit: 5,
        windowMs: 10 * 60 * 1000,
        message: "Too many sign-in attempts. Please try again later.",
    },
    googleSignIn: {
        limit: 8,
        windowMs: 10 * 60 * 1000,
        message: "Too many Google sign-in attempts. Please try again later.",
    },
    changePassword: {
        limit: 5,
        windowMs: 15 * 60 * 1000,
        message: "Too many password change attempts. Please try again later.",
    },
    global: {
        limit: 20,
        windowMs: 30 * 60 * 1000,
        message: "Too many authentication requests from this IP. Please try again later.",
    },
} as const;

export async function createSessionTokens(
    ctx: { db: any },
    userId: Id<"users">,
    deviceInfo?: string,
    ipAddress?: string
) {
    const accessSecret = getAccessTokenSecret();
    const refreshSecret = getRefreshTokenSecret();
    const accessExpiryMs = getAccessTokenExpiryMs();
    const refreshExpiryMs = getRefreshTokenExpiryMs();

    const sessionId = await ctx.db.insert("sessions", {
        userId,
        refreshTokenHash: "pending",
        deviceInfo,
        ipAddress,
        isRevoked: false,
        expiresAt: Date.now() + refreshExpiryMs,
        createdAt: Date.now(),
    });

    const accessToken = await createToken(
        { sub: userId, sid: sessionId, type: "access" },
        accessSecret,
        accessExpiryMs
    );

    const refreshToken = await createToken(
        { sub: userId, sid: sessionId, type: "refresh" },
        refreshSecret,
        refreshExpiryMs
    );

    const refreshTokenHash = await sha256(refreshToken);
    await ctx.db.patch(sessionId, { refreshTokenHash });

    return { accessToken, refreshToken, sessionId };
}
