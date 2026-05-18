/**
 * Pure-function unit tests for JWT, password hashing, rate-limit key builder,
 * review counter helpers, and location/geofencing utilities.
 *
 * These do NOT need convex-test because they test standalone helper functions.
 */
import { describe, expect, it } from "vitest";

// ─── JWT ─────────────────────────────────────────────────────────────────────
import { createToken, sha256, verifyToken } from "../lib/jwt";

describe("JWT createToken / verifyToken", () => {
  const SECRET = "test-secret-key-with-enough-entropy";
  const payload = { sub: "user123", sid: "session456", type: "access" as const };

  it("round-trips: create → verify returns original payload fields", async () => {
    const token = await createToken(payload, SECRET, 60_000);
    const decoded = await verifyToken(token, SECRET);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.sid).toBe(payload.sid);
    expect(decoded.type).toBe("access");
    expect(decoded.exp).toBeGreaterThan(Date.now() - 1000);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await createToken(payload, SECRET, 60_000);
    await expect(verifyToken(token, "wrong-secret")).rejects.toThrow(
      "Invalid token signature"
    );
  });

  it("rejects an expired token", async () => {
    const token = await createToken(payload, SECRET, -1);
    await expect(verifyToken(token, SECRET)).rejects.toThrow("Token expired");
  });

  it("rejects a malformed token string", async () => {
    await expect(verifyToken("not.a.valid.jwt.string", SECRET)).rejects.toThrow();
  });

  it("rejects a tampered payload", async () => {
    const token = await createToken(payload, SECRET, 60_000);
    const parts = token.split(".");
    // Tamper with the payload segment
    parts[1] = parts[1] + "x";
    const tampered = parts.join(".");
    await expect(verifyToken(tampered, SECRET)).rejects.toThrow();
  });
});

describe("sha256", () => {
  it("produces a 64-character hex string", async () => {
    const hash = await sha256("hello");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", async () => {
    const a = await sha256("litloop");
    const b = await sha256("litloop");
    expect(a).toBe(b);
  });

  it("different inputs produce different hashes", async () => {
    const a = await sha256("password1");
    const b = await sha256("password2");
    expect(a).not.toBe(b);
  });
});

// ─── Password Hashing ────────────────────────────────────────────────────────
import { hashPassword, verifyPassword } from "../lib/authHelpers";

describe("PBKDF2 password hashing", () => {
  it("hash → verify round-trip succeeds", async () => {
    const hash = await hashPassword("mysecurepassword");
    const ok = await verifyPassword("mysecurepassword", hash);
    expect(ok).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("correct-password");
    const ok = await verifyPassword("wrong-password", hash);
    expect(ok).toBe(false);
  });

  it("produces pbkdf2$ prefixed output", async () => {
    const hash = await hashPassword("test");
    expect(hash).toMatch(/^pbkdf2\$/);
    expect(hash.split("$")).toHaveLength(3);
  });

  it("each hash has a unique salt", async () => {
    const h1 = await hashPassword("same-password");
    const h2 = await hashPassword("same-password");
    expect(h1).not.toBe(h2); // Different salts
    // But both verify correctly
    expect(await verifyPassword("same-password", h1)).toBe(true);
    expect(await verifyPassword("same-password", h2)).toBe(true);
  });
});

describe("Legacy SHA-256 password verification", () => {
  it("verifies a legacy SHA-256 hash (no salt prefix)", async () => {
    // Pre-compute SHA-256 of "legacypass"
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode("legacypass")
    );
    const legacyHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const ok = await verifyPassword("legacypass", legacyHash);
    expect(ok).toBe(true);
  });

  it("rejects wrong password against legacy hash", async () => {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode("legacypass")
    );
    const legacyHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const ok = await verifyPassword("wrongpass", legacyHash);
    expect(ok).toBe(false);
  });
});

// ─── Rate Limit Key Builder ──────────────────────────────────────────────────
import { buildRateLimitKey } from "../lib/rateLimit";

describe("buildRateLimitKey", () => {
  it("joins scope, action, and identifiers with colons", () => {
    const key = buildRateLimitKey("auth", "signIn", "user@example.com", "1.2.3.4");
    expect(key).toBe("auth:signIn:user@example.com:1.2.3.4");
  });

  it("filters out undefined and null identifiers", () => {
    const key = buildRateLimitKey("auth", "signIn", "email@test.com", undefined, null);
    expect(key).toBe("auth:signIn:email@test.com");
  });

  it("filters out empty string identifiers", () => {
    const key = buildRateLimitKey("auth", "signIn", "", "  ");
    expect(key).toBe("auth:signIn");
  });

  it("converts numeric identifiers to strings", () => {
    const key = buildRateLimitKey("rental", "request", 12345);
    expect(key).toBe("rental:request:12345");
  });
});

// ─── Review Counters ─────────────────────────────────────────────────────────
import {
  getRatingStar,
  getRatingCountField,
  incrementRatingCountPatch,
  moveRatingCountPatch,
} from "../lib/reviewCounters";

describe("getRatingStar", () => {
  it("clamps values below 1 to 1", () => {
    expect(getRatingStar(0)).toBe(1);
    expect(getRatingStar(-5)).toBe(1);
  });

  it("clamps values above 5 to 5", () => {
    expect(getRatingStar(6)).toBe(5);
    expect(getRatingStar(100)).toBe(5);
  });

  it("rounds fractional ratings", () => {
    expect(getRatingStar(3.4)).toBe(3);
    expect(getRatingStar(3.5)).toBe(4);
    expect(getRatingStar(4.7)).toBe(5);
  });

  it("returns exact integers unchanged", () => {
    expect(getRatingStar(1)).toBe(1);
    expect(getRatingStar(3)).toBe(3);
    expect(getRatingStar(5)).toBe(5);
  });
});

describe("getRatingCountField", () => {
  it("returns rating1Count..rating5Count for valid ratings", () => {
    expect(getRatingCountField(1)).toBe("rating1Count");
    expect(getRatingCountField(3)).toBe("rating3Count");
    expect(getRatingCountField(5)).toBe("rating5Count");
  });
});

describe("incrementRatingCountPatch", () => {
  it("increments a count field", () => {
    const book = { rating3Count: 5 };
    const patch = incrementRatingCountPatch(book, 3, 1);
    expect(patch).toEqual({ rating3Count: 6 });
  });

  it("decrements with floor at 0", () => {
    const book = { rating1Count: 0 };
    const patch = incrementRatingCountPatch(book, 1, -1);
    expect(patch).toEqual({ rating1Count: 0 });
  });

  it("handles missing field (defaults to 0)", () => {
    const book = {};
    const patch = incrementRatingCountPatch(book, 4, 1);
    expect(patch).toEqual({ rating4Count: 1 });
  });
});

describe("moveRatingCountPatch", () => {
  it("decrements old field and increments new field", () => {
    const book = { rating3Count: 5, rating5Count: 2 };
    const patch = moveRatingCountPatch(book, 3, 5);
    expect(patch).toEqual({ rating3Count: 4, rating5Count: 3 });
  });

  it("returns empty patch when old === new rating", () => {
    const book = { rating4Count: 10 };
    const patch = moveRatingCountPatch(book, 4, 4);
    expect(patch).toEqual({});
  });
});

// ─── Location Utilities ──────────────────────────────────────────────────────
import {
  normalize,
  haversineDistanceKm,
  getDeliveryAreaByName,
  validateDeliveryAreaSelection,
  detectDeliveryAreaFromAddress,
} from "../../utils/location/areas";

describe("normalize", () => {
  it("lowercases and strips special characters", () => {
    expect(normalize("Arundel Pet!")).toBe("arundel pet");
  });

  it("collapses multiple spaces", () => {
    expect(normalize("  hello   world  ")).toBe("hello world");
  });

  it("returns empty string for empty input", () => {
    expect(normalize("")).toBe("");
  });
});

describe("haversineDistanceKm", () => {
  it("returns 0 for identical coordinates", () => {
    const d = haversineDistanceKm(16.3046, 80.4365, 16.3046, 80.4365);
    expect(d).toBeCloseTo(0, 5);
  });

  it("calculates known distance approximately", () => {
    // Arundelpet to Brodipet is ~0.3-0.5 km
    const d = haversineDistanceKm(16.3046, 80.4365, 16.3078, 80.4377);
    expect(d).toBeGreaterThan(0.1);
    expect(d).toBeLessThan(1.0);
  });
});

describe("getDeliveryAreaByName", () => {
  it("finds an area by exact name", () => {
    const area = getDeliveryAreaByName("Arundelpet");
    expect(area).toBeDefined();
    expect(area!.name).toBe("Arundelpet");
  });

  it("finds an area by alias", () => {
    const area = getDeliveryAreaByName("Arundel Pet");
    expect(area).toBeDefined();
    expect(area!.name).toBe("Arundelpet");
  });

  it("returns undefined for unknown area", () => {
    expect(getDeliveryAreaByName("Nonexistent Place")).toBeUndefined();
  });
});

describe("detectDeliveryAreaFromAddress", () => {
  it("detects area from address text", () => {
    const area = detectDeliveryAreaFromAddress(
      "123 Main Street, Brodipet, Guntur"
    );
    expect(area).toBeDefined();
    expect(area!.name).toBe("Brodipet");
  });

  it("returns undefined for address without known area", () => {
    expect(detectDeliveryAreaFromAddress("123 Unknown Place, Hyderabad")).toBeUndefined();
  });
});

describe("validateDeliveryAreaSelection", () => {
  it("validates matching area + coordinates inside geofence", () => {
    const result = validateDeliveryAreaSelection({
      selectedArea: "Arundelpet",
      latitude: 16.3046,
      longitude: 80.4365,
    });
    expect(result.isValid).toBe(true);
  });

  it("rejects unknown area", () => {
    const result = validateDeliveryAreaSelection({
      selectedArea: "Nonexistent",
      latitude: 16.3046,
      longitude: 80.4365,
    });
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.reason).toBe("invalid_area");
    }
  });

  it("rejects coordinates outside selected area geofence", () => {
    const result = validateDeliveryAreaSelection({
      selectedArea: "Arundelpet",
      // Coordinates far from Arundelpet (Hyderabad)
      latitude: 17.385,
      longitude: 78.4867,
    });
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.reason).toBe("outside_geofence");
    }
  });

  it("rejects when address detects a different area than selected", () => {
    const result = validateDeliveryAreaSelection({
      selectedArea: "Arundelpet",
      formattedAddress: "Some address in Brodipet area",
    });
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.reason).toBe("address_mismatch");
    }
  });
});
