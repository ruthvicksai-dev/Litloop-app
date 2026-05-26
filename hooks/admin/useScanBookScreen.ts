import { useToast } from "@/context/ToastContext";
import { useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";

export type ScanBookParams = {
    source?: "add-book" | "edit-book";
};

/**
 * Validates and normalizes a scanned barcode string into an ISBN.
 * Accepts ISBN-13 (any 13-digit EAN), ISBN-10, and UPC-A (12-digit) formats.
 */
function normalizeScannedIsbn(raw: string): string | null {
    const cleaned = raw.replace(/[-\s]/g, "").trim().toUpperCase();

    // ISBN-13: any 13-digit number (covers 978/979 and other EAN-13)
    if (/^\d{13}$/.test(cleaned)) return cleaned;

    // ISBN-10: 9 digits + digit or X
    if (/^\d{9}[\dX]$/.test(cleaned)) return cleaned;

    // UPC-A: 12-digit barcode — prefix with 0 to make 13 digits for lookup
    if (/^\d{12}$/.test(cleaned)) return "0" + cleaned;

    return null;
}

export function useScanBookScreen(params?: ScanBookParams) {
    const router = useRouter();
    const { showToast } = useToast();
    const [permission, requestPermission] = useCameraPermissions();
    const [hasScanned, setHasScanned] = useState(false);
    const scanLockRef = useRef(false);
    const lastRejectedRef = useRef("");

    const handleBarcodeScanned = useCallback(
        (data: string) => {
            const isbn = normalizeScannedIsbn(data);

            if (!isbn) {
                // Show feedback once per unique rejected barcode
                if (data !== lastRejectedRef.current) {
                    lastRejectedRef.current = data;
                    showToast("Not a valid ISBN barcode. Try again.", "error");
                }
                return;
            }

            if (scanLockRef.current) return;
            scanLockRef.current = true;
            setHasScanned(true);

            // Navigate immediately with just the ISBN — fetching happens on Add Book page
            router.replace({
                pathname: "/(admin)/add-book",
                params: { scannedIsbn: isbn },
            });
        },
        [router, showToast]
    );

    const handleTryAnotherMethod = useCallback(() => {
        if (params?.source === "edit-book") {
            router.back();
        } else {
            router.replace({
                pathname: "/(admin)/add-book",
                params: { manual: "true" },
            });
        }
    }, [router, params?.source]);

    const resetScanner = useCallback(() => {
        setHasScanned(false);
        scanLockRef.current = false;
        lastRejectedRef.current = "";
    }, []);

    return {
        permission,
        requestPermission,
        hasScanned,
        handleBarcodeScanned,
        handleTryAnotherMethod,
        resetScanner,
    };
}
