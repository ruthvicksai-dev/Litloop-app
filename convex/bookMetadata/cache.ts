import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { NormalizedBookMetadata } from "./types";

const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

/**
 * Generates a deterministic cache key from lookup parameters.
 * ISBN lookups use the normalized ISBN; title lookups use "title::author" lowercase.
 */
export function makeCacheKey(isbn?: string, title?: string, author?: string): string {
    if (isbn && isbn.trim()) {
        return `isbn:${isbn.trim()}`;
    }
    const t = (title || "").trim().toLowerCase();
    const a = (author || "").trim().toLowerCase();
    return `title:${t}::${a}`;
}

/**
 * Internal query: retrieve cached metadata if not expired.
 */
export const getCachedMetadata = internalQuery({
    args: { lookupKey: v.string() },
    handler: async (ctx, args): Promise<{
        metadata: NormalizedBookMetadata;
        provider: string;
    } | null> => {
        const cached = await ctx.db
            .query("metadata_cache")
            .withIndex("by_lookupKey", (q) => q.eq("lookupKey", args.lookupKey))
            .first();

        if (!cached) return null;

        // Check expiration
        if (cached.expiresAt < Date.now()) {
            return null;
        }

        try {
            const metadata: NormalizedBookMetadata = JSON.parse(cached.metadata);
            return { metadata, provider: cached.provider };
        } catch {
            return null;
        }
    },
});

/**
 * Internal mutation: store metadata in cache with 90-day TTL.
 */
export const setCachedMetadata = internalMutation({
    args: {
        lookupKey: v.string(),
        provider: v.string(),
        metadata: v.string(),
    },
    handler: async (ctx, args) => {
        // Upsert: delete existing entry for this key first
        const existing = await ctx.db
            .query("metadata_cache")
            .withIndex("by_lookupKey", (q) => q.eq("lookupKey", args.lookupKey))
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
        }

        const now = Date.now();
        await ctx.db.insert("metadata_cache", {
            lookupKey: args.lookupKey,
            provider: args.provider,
            metadata: args.metadata,
            createdAt: now,
            expiresAt: now + CACHE_TTL_MS,
        });
    },
});

/**
 * Internal mutation: delete expired cache entries in batches.
 * Called by the weekly cron job.
 */
export const cleanupExpiredCache = internalMutation({
    args: { batchSize: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.batchSize ?? 200;
        const now = Date.now();

        const expired = await ctx.db
            .query("metadata_cache")
            .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
            .take(limit);

        let deleted = 0;
        for (const entry of expired) {
            await ctx.db.delete(entry._id);
            deleted++;
        }

        console.log(`[MetadataCache] Cleaned up ${deleted} expired entries.`);
        return { deleted };
    },
});
