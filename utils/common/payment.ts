// ─── UPI Config ─────────────────────────────────────────────────────────────
// Fallback values used when backend-driven payment settings are unavailable.
// In production, the frontend fetches UPI config from getActiveSettings query.
export const UPI_ID_FALLBACK = process.env.EXPO_PUBLIC_UPI_ID ?? "YOUR_UPI_ID@upi";
export const PAYEE_NAME_FALLBACK = "Lit Loop";

// Legacy export for backward compatibility (used by components not yet migrated)
export const UPI_ID = UPI_ID_FALLBACK;
export const PAYEE_NAME = PAYEE_NAME_FALLBACK;

/** Maximum upload file size for payment screenshots (10 MB). */
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Builds a UPI payment deeplink URI.
 *
 * @param amount   – Rental amount in INR
 * @param orderId  – Rental/order ID for transaction note
 * @param upiId    – Merchant UPI ID (from backend settings or fallback)
 * @param payeeName – Merchant display name (from backend settings or fallback)
 */
export function buildUpiUri(
    amount: number,
    orderId: string,
    upiId: string = UPI_ID_FALLBACK,
    payeeName: string = PAYEE_NAME_FALLBACK
): string {
    const params = new URLSearchParams({
        pa: upiId,
        pn: payeeName,
        am: amount.toFixed(2),
        tn: `LitLoop-${orderId}`,
        cu: "INR",
    });
    return `upi://pay?${params.toString()}`;
}
