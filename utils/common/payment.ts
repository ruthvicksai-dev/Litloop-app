// Fallback values used when backend-driven payment settings are not yet loaded.
// The frontend fetches the active UPI config dynamically from the admin payment settings.
export const UPI_ID_FALLBACK = process.env.EXPO_PUBLIC_UPI_ID ?? "";
export const PAYEE_NAME_FALLBACK = "Lit Loop";

// Legacy export for backward compatibility (used by components not yet migrated)
export const UPI_ID = UPI_ID_FALLBACK;
export const PAYEE_NAME = PAYEE_NAME_FALLBACK;

/** Maximum upload file size for payment screenshots (10 MB). */
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Builds a clean, universal NPCI UPI payment URI.
 *
 * Uses standard P2P Collect format:
 * `upi://pay?pa={upiId}&pn={payeeName}&am={amount}&cu=INR`
 *
 * By strictly omitting merchant-only tracking tags (`tr`, `mc`, `mode`),
 * Google Pay (Tez) and PhonePe open their native UPI payment screen directly
 * without triggering Google Play Merchant / PhonePe B2B SDK account validation errors.
 */
export function buildUpiUri(
    amount: number,
    orderId?: string,
    upiId: string = UPI_ID_FALLBACK,
    payeeName: string = PAYEE_NAME_FALLBACK
): string {
    const rawUpiId = (upiId || "").trim();
    if (!rawUpiId) return "";

    const cleanPayee = (payeeName || "LitLoop").trim().replace(/[^a-zA-Z0-9 ]/g, "");
    const am = Math.max(0, amount).toFixed(2);

    return `upi://pay?pa=${rawUpiId}&pn=${encodeURIComponent(cleanPayee)}&am=${am}&cu=INR`;
}
