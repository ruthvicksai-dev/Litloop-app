/**
 * General formatting utilities.
 */

/**
 * Formats a number as Indian Rupee currency string (e.g. ₹1,200).
 */
export const formatCurrency = (amount?: number | null): string =>
    `\u20B9${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount ?? 0)}`;
