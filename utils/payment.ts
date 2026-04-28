// ─── UPI Config ─────────────────────────────────────────────────────────────
// Replace YOUR_UPI_ID@upi with the actual UPI ID for receiving payments.
export const UPI_ID = process.env.EXPO_PUBLIC_UPI_ID ?? "YOUR_UPI_ID@upi";
export const PAYEE_NAME = "Lit Loop";

export function buildUpiUri(amount: number, orderId: string): string {
    const params = new URLSearchParams({
        pa: UPI_ID,
        pn: PAYEE_NAME,
        am: amount.toFixed(2),
        tn: `LitLoop-${orderId}`,
        cu: "INR",
    });
    return `upi://pay?${params.toString()}`;
}
