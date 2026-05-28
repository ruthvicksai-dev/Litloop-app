import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthenticatedUser } from "../lib/authHelpers";

/** Normalize a string for deduplication comparison. */
function norm(s?: string): string {
    return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Create a dedup key for an address so we can detect duplicates. */
function addressKey(zone: string, loc: Record<string, unknown>): string {
    if (zone === "College") {
        return `college|${norm(loc.roomNo as string)}|${norm(loc.department as string)}`;
    }
    return `home|${norm(loc.area as string)}|${norm(loc.landmark as string)}`;
}

interface AddressTemplate {
    id: string;
    zone: string;
    phone: string;
    area?: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
    formattedAddress?: string;
    roomNo?: string;
    yearOfStudy?: string;
    department?: string;
    rollNo?: string;
    lastUsedAt: number;
    hasGpsCoords: boolean;
}

/**
 * Derive up to 3 unique, recent address templates from a user's rental history.
 * No new DB table — purely derived from the existing `rentals` collection.
 */
export const getUserRecentAddresses = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args): Promise<AddressTemplate[]> => {
        const user = await getAuthenticatedUser(ctx, args.accessToken);

        // Fetch the 15 most recent rentals (enough to find 3 unique addresses)
        const rentals = await ctx.db
            .query("rentals")
            .withIndex("by_userId_createdAt", (q) => q.eq("userId", user._id))
            .order("desc")
            .take(15);

        const seen = new Map<string, AddressTemplate>();

        for (const rental of rentals) {
            if (seen.size >= 3) break;

            // Check both deliveryLocation and pickupLocation
            const candidates: { loc: typeof rental.deliveryLocation; ts: number }[] = [];

            if (rental.deliveryLocation) {
                candidates.push({ loc: rental.deliveryLocation, ts: rental.createdAt });
            }
            if (rental.pickupLocation) {
                candidates.push({ loc: rental.pickupLocation, ts: rental.createdAt });
            }

            for (const { loc, ts } of candidates) {
                if (seen.size >= 3) break;
                if (!loc.phone) continue; // Skip incomplete addresses

                const key = addressKey(rental.zone, loc as Record<string, unknown>);

                // Only keep the newest (first encountered, since sorted desc)
                if (seen.has(key)) continue;

                seen.set(key, {
                    id: key,
                    zone: rental.zone,
                    phone: loc.phone,
                    area: loc.area,
                    landmark: loc.landmark,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    formattedAddress: loc.formattedAddress,
                    roomNo: loc.roomNo,
                    yearOfStudy: loc.yearOfStudy,
                    department: loc.department,
                    rollNo: loc.rollNo,
                    lastUsedAt: ts,
                    hasGpsCoords: typeof loc.latitude === "number" && typeof loc.longitude === "number",
                });
            }
        }

        return Array.from(seen.values());
    },
});
