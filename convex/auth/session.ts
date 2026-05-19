import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { assertAdmin, getAccessTokenSecret, getRefreshTokenSecret, getUserIdFromAccessToken } from "../lib/authHelpers";
import { sha256, verifyToken } from "../lib/jwt";
import { createSessionTokens, getSessionRefreshTokenHash, isSessionRevoked } from "./helpers";

export const getSession = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        try {
            const secret = getAccessTokenSecret();
            const payload = await verifyToken(args.accessToken, secret);

            if (payload.type !== "access") {
                return null;
            }

            const sid = payload.sid as Id<"sessions">;
            const session = await ctx.db.get(sid);
            if (!session || isSessionRevoked(session) || session.expiresAt < Date.now()) {
                return null;
            }

            const userId = payload.sub as Id<"users">;
            const user = await ctx.db.get(userId);
            if (!user) return null;

            return {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatarUrl: user.avatarUrl,
                role: user.role,
                pushToken: user.pushToken,
                isVerifiedStudent: user.isVerifiedStudent,
            };
        } catch {
            return null;
        }
    },
});

export const refreshSession = mutation({
    args: { refreshToken: v.string() },
    handler: async (ctx, args) => {
        const secret = getRefreshTokenSecret();

        let payload;
        try {
            payload = await verifyToken(args.refreshToken, secret);
        } catch (err: any) {
            console.warn("[Auth] Refresh token JWT verification failed", { reason: err.message });
            throw new Error("Session expired. Please sign in again.");
        }

        if (payload.type !== "refresh") {
            throw new Error("Invalid token type.");
        }

        const sid = payload.sid as Id<"sessions">;
        const session = await ctx.db.get(sid);

        if (!session) {
            console.warn("[Auth] Session not found for sID", { sid });
            throw new Error("Session invalid. Please sign in again.");
        }

        const incomingHash = await sha256(args.refreshToken);
        const storedHash = getSessionRefreshTokenHash(session);
        if (!storedHash || storedHash !== incomingHash) {
            console.error("[Auth] Security Alert: Sid-Hash mismatch for session", { sid });
            throw new Error("Invalid session data.");
        }

        if (session.expiresAt < Date.now()) {
            await ctx.db.patch(sid, { isRevoked: true });
            throw new Error("Session expired. Please sign in again.");
        }

        const userId = payload.sub as Id<"users">;

        if (isSessionRevoked(session)) {
            if (session.replacedBySessionId) {
                console.warn("[Auth] Stale refresh retry after rotation", {
                    userId,
                    sid,
                    replacedBySessionId: session.replacedBySessionId,
                });
            } else {
                console.warn("[Auth] Refresh token used for a revoked session", { userId, sid });
            }
            throw new Error("Session expired. Please sign in again.");
        }

        const { accessToken, refreshToken, sessionId: newSid } = await createSessionTokens(
            ctx,
            userId,
            session.deviceInfo,
            session.ipAddress
        );

        await ctx.db.patch(sid, {
            isRevoked: true,
            replacedBySessionId: newSid,
        });

        return { accessToken, refreshToken };
    },
});

export const getUserSessions = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        let userId: Id<"users">;
        try {
            userId = await getUserIdFromAccessToken(args.accessToken);
        } catch {
            return [];
        }

        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_userId_active", (q) => q.eq("userId", userId).eq("isRevoked", false))
            .order("desc")
            .collect();

        return sessions.map((s: any) => ({
            _id: s._id,
            deviceInfo: s.deviceInfo || "Unknown Device",
            ipAddress: s.ipAddress,
            isActive: s.expiresAt > Date.now(),
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
        }));
    },
});

export const revokeSession = mutation({
    args: {
        accessToken: v.string(),
        sessionId: v.id("sessions")
    },
    handler: async (ctx, args) => {
        let userId: Id<"users">;
        try {
            userId = await getUserIdFromAccessToken(args.accessToken);
        } catch {
            throw new Error("Unauthenticated");
        }

        const session = await ctx.db.get(args.sessionId);
        if (!session || session.userId !== userId) {
            throw new Error("Session not found or unauthorized");
        }

        await ctx.db.patch(session._id, { isRevoked: true });
        return true;
    },
});

export const revokeAllSessions = mutation({
    args: {
        accessToken: v.string(),
        exceptCurrent: v.optional(v.boolean())
    },
    handler: async (ctx, args) => {
        const secret = getAccessTokenSecret();
        const payload = await verifyToken(args.accessToken, secret);
        const userId = payload.sub as Id<"users">;
        const currentSid = payload.sid as string;

        const activeSessions = await ctx.db
            .query("sessions")
            .withIndex("by_userId_active", (q) => q.eq("userId", userId).eq("isRevoked", false))
            .collect();

        for (const s of activeSessions) {
            if (args.exceptCurrent && s._id === currentSid) {
                continue;
            }
            await ctx.db.patch(s._id, { isRevoked: true });
        }
        return true;
    },
});

export const signOut = mutation({
    args: { refreshToken: v.string() },
    handler: async (ctx, args) => {
        try {
            const secret = getRefreshTokenSecret();
            const payload = await verifyToken(args.refreshToken, secret);
            const sid = payload.sid as Id<"sessions">;
            await ctx.db.patch(sid, { isRevoked: true });
        } catch {
            try {
                const refreshTokenHash = await sha256(args.refreshToken);
                const session = await ctx.db
                    .query("sessions")
                    .withIndex("by_refreshTokenHash", (q) => q.eq("refreshTokenHash", refreshTokenHash))
                    .first();

                if (session) {
                    await ctx.db.patch(session._id, { isRevoked: true });
                }
            } catch {
                // Ignore all errors during sign-out
            }
        }
    },
});

export const backfillLegacySessions = mutation({
    args: {
        accessToken: v.string(),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);
        const results = await ctx.db
            .query("sessions")
            .order("asc")
            .paginate(args.paginationOpts);
        const sessions = results.page;
        let updated = 0;

        for (const session of sessions) {
            const refreshTokenHash = getSessionRefreshTokenHash(session);
            const isRevoked = isSessionRevoked(session);

            if (
                session.refreshTokenHash === refreshTokenHash &&
                session.isRevoked === isRevoked
            ) {
                continue;
            }

            await ctx.db.patch(session._id, {
                refreshTokenHash,
                isRevoked,
            });
            updated += 1;
        }

        return {
            scanned: sessions.length,
            updated,
            continueCursor: results.continueCursor,
            isDone: results.isDone,
        };
    },
});

export const backfillUsers = mutation({
    args: {
        accessToken: v.string(),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);
        const results = await ctx.db
            .query("users")
            .order("asc")
            .paginate(args.paginationOpts);
        const users = results.page;
        let updated = 0;

        for (const user of users) {
            if (user.providers && user.providers.length > 0) {
                continue;
            }

            await ctx.db.patch(user._id, {
                providers: ["local"],
            });
            updated += 1;
        }

        return {
            scanned: users.length,
            updated,
            continueCursor: results.continueCursor,
            isDone: results.isDone,
        };
    },
});
