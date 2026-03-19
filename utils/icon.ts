import { Ionicons } from "@expo/vector-icons";

/**
 * Maps detail labels to their corresponding Ionicons.
 * @param label The label of the detail row.
 * @returns The icon name for Ionicons.
 */
export function getDetailIcon(label: string): keyof typeof Ionicons.glyphMap {
    switch (label) {
        case "Book":
            return "book-outline";
        case "Author":
            return "person-outline";
        case "Zone":
            return "location-outline";
        case "Delivery":
        case "Pickup":
            return "calendar-outline";
        case "Delivery Time":
        case "Pickup Time":
            return "time-outline";
        default:
            return "wallet-outline";
    }
}
