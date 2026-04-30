export type DeliveryAreaZone = "Central" | "Residential" | "Outskirts";

export const DELIVERY_ZONE_DETAILS: Record<
    DeliveryAreaZone,
    {
        label: string;
        etaLabel: string;
        etaRange: string;
    }
> = {
    Central: {
        label: "Central / Core Guntur",
        etaLabel: "Fast delivery",
        etaRange: "1-2 hours",
    },
    Residential: {
        label: "Residential Areas",
        etaLabel: "Standard delivery",
        etaRange: "2-3 hours",
    },
    Outskirts: {
        label: "Outskirts",
        etaLabel: "Scheduled delivery",
        etaRange: "3-4 hours or limited slots",
    },
};

type DeliveryAreaConfig = {
    name: string;
    zone: DeliveryAreaZone;
    center: {
        latitude: number;
        longitude: number;
    };
    radiusKm: number;
    aliases?: readonly string[];
};

export const DELIVERY_AREAS: readonly DeliveryAreaConfig[] = [
    {
        name: "Arundelpet",
        zone: "Central",
        center: { latitude: 16.3046, longitude: 80.4365 },
        radiusKm: 1.6,
        aliases: ["Arundel Pet"],
    },
    {
        name: "Brodipet",
        zone: "Central",
        center: { latitude: 16.3078, longitude: 80.4377 },
        radiusKm: 1.6,
        aliases: ["Brodi Pet"],
    },
    {
        name: "Lakshmipuram",
        zone: "Central",
        center: { latitude: 16.3094, longitude: 80.4414 },
        radiusKm: 1.6,
        aliases: ["Laxmipuram"],
    },
    {
        name: "Pattabhipuram",
        zone: "Central",
        center: { latitude: 16.3184, longitude: 80.4305 },
        radiusKm: 1.8,
        aliases: ["Pattabhi Puram", "Patabhipuram"],
    },
    {
        name: "Old Guntur",
        zone: "Central",
        center: { latitude: 16.2915, longitude: 80.4573 },
        radiusKm: 1.8,
        aliases: ["Oldguntur"],
    },
    {
        name: "Anandapet",
        zone: "Central",
        center: { latitude: 16.2892, longitude: 80.4525 },
        radiusKm: 1.8,
    },
    {
        name: "Balaji Nagar",
        zone: "Central",
        center: { latitude: 16.3138, longitude: 80.4258 },
        radiusKm: 1.8,
        aliases: ["Balajinagar"],
    },
    {
        name: "Kanna Vari Thota",
        zone: "Central",
        center: { latitude: 16.3018, longitude: 80.4478 },
        radiusKm: 1.6,
        aliases: ["Kannavari Thota"],
    },
    {
        name: "Islampet",
        zone: "Central",
        center: { latitude: 16.2941, longitude: 80.4493 },
        radiusKm: 1.6,
    },
    {
        name: "Railpet",
        zone: "Central",
        center: { latitude: 16.2989, longitude: 80.4307 },
        radiusKm: 1.7,
    },
    {
        name: "Koritapadu",
        zone: "Residential",
        center: { latitude: 16.3152, longitude: 80.4238 },
        radiusKm: 1.8,
        aliases: ["Korita Padu"],
    },
    {
        name: "Syamalanagar",
        zone: "Residential",
        center: { latitude: 16.3237, longitude: 80.4336 },
        radiusKm: 1.8,
        aliases: ["Shyamalanagar", "Syamala Nagar", "Shyamala Nagar"],
    },
    {
        name: "Vidyanagar",
        zone: "Residential",
        center: { latitude: 16.3296, longitude: 80.4284 },
        radiusKm: 1.8,
        aliases: ["Vidya Nagar"],
    },
    {
        name: "Navabharath Nagar",
        zone: "Residential",
        center: { latitude: 16.3268, longitude: 80.4187 },
        radiusKm: 1.8,
        aliases: ["Navabharat Nagar", "Navabharathnagar"],
    },
    {
        name: "Brundavan Gardens",
        zone: "Residential",
        center: { latitude: 16.3189, longitude: 80.4462 },
        radiusKm: 1.8,
        aliases: ["Brindavan Gardens"],
    },
    {
        name: "SVN Colony",
        zone: "Residential",
        center: { latitude: 16.3322, longitude: 80.4128 },
        radiusKm: 1.8,
        aliases: ["Svn Colony", "SVNColony"],
    },
    {
        name: "AT Agraharam",
        zone: "Residential",
        center: { latitude: 16.3032, longitude: 80.4526 },
        radiusKm: 1.8,
        aliases: ["AT Agraharam Road", "A T Agraharam"],
    },
    {
        name: "Gorantla",
        zone: "Outskirts",
        center: { latitude: 16.3098, longitude: 80.4688 },
        radiusKm: 2,
        aliases: ["Gorantala"],
    },
    {
        name: "Autonagar",
        zone: "Outskirts",
        center: { latitude: 16.3071, longitude: 80.4779 },
        radiusKm: 2,
        aliases: ["Auto Nagar"],
    },
] as const;

export type AllowedArea = (typeof DELIVERY_AREAS)[number]["name"];

export const ALLOWED_AREAS = DELIVERY_AREAS.map((area) => area.name);

export const DELIVERY_AREA_GROUPS = [
    {
        zone: "Central" as const,
        title: DELIVERY_ZONE_DETAILS.Central.label,
        areas: DELIVERY_AREAS.filter((area) => area.zone === "Central").map((area) => area.name),
    },
    {
        zone: "Residential" as const,
        title: DELIVERY_ZONE_DETAILS.Residential.label,
        areas: DELIVERY_AREAS.filter((area) => area.zone === "Residential").map((area) => area.name),
    },
    {
        zone: "Outskirts" as const,
        title: DELIVERY_ZONE_DETAILS.Outskirts.label,
        areas: DELIVERY_AREAS.filter((area) => area.zone === "Outskirts").map((area) => area.name),
    },
];

export type DeliveryAreaValidationResult =
    | {
        isValid: true;
        message: string;
        selectedArea: DeliveryAreaConfig;
        matchedBy: "address" | "geofence";
        distanceKm?: number;
    }
    | {
        isValid: false;
        message: string;
        reason: "invalid_area" | "missing_location" | "address_mismatch" | "outside_geofence";
        selectedArea?: DeliveryAreaConfig;
        detectedArea?: DeliveryAreaConfig;
        distanceKm?: number;
    };

export function normalize(text: string): string {
    if (!text) return "";
    return text
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, " ")
        .trim()
        .replace(/\s+/g, " ");
}

function getSearchTerms(area: DeliveryAreaConfig): string[] {
    return Array.from(
        new Set([area.name, ...(area.aliases ?? [])].map((value) => normalize(value)).filter(Boolean))
    );
}

export function getDeliveryAreaByName(areaName: string): DeliveryAreaConfig | undefined {
    const normalized = normalize(areaName);
    if (!normalized) return undefined;

    return DELIVERY_AREAS.find((area) => getSearchTerms(area).includes(normalized));
}

export function getDeliveryAreaMeta(areaName: string) {
    const area = getDeliveryAreaByName(areaName);
    if (!area) return null;

    return {
        area,
        zone: DELIVERY_ZONE_DETAILS[area.zone],
    };
}

export function detectDeliveryAreaFromAddress(addressText: string): DeliveryAreaConfig | undefined {
    const normalizedAddress = normalize(addressText);
    if (!normalizedAddress) return undefined;

    let bestMatch: { area: DeliveryAreaConfig; termLength: number } | undefined;

    for (const area of DELIVERY_AREAS) {
        for (const term of getSearchTerms(area)) {
            if (!normalizedAddress.includes(term)) continue;
            if (!bestMatch || term.length > bestMatch.termLength) {
                bestMatch = { area, termLength: term.length };
            }
        }
    }

    return bestMatch?.area;
}

export function haversineDistanceKm(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
): number {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;

    const dLat = toRadians(endLat - startLat);
    const dLng = toRadians(endLng - startLng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(startLat)) *
        Math.cos(toRadians(endLat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}

export function findDeliveryAreaByCoordinates(latitude: number, longitude: number) {
    const matches = DELIVERY_AREAS.map((area) => ({
        area,
        distanceKm: haversineDistanceKm(
            latitude,
            longitude,
            area.center.latitude,
            area.center.longitude
        ),
    }))
        .filter((match) => match.distanceKm <= match.area.radiusKm)
        .sort((first, second) => first.distanceKm - second.distanceKm);

    return matches[0];
}

export function resolveDeliveryAreaFromLocation(params: {
    formattedAddress?: string;
    latitude?: number;
    longitude?: number;
}) {
    const addressArea = params.formattedAddress
        ? detectDeliveryAreaFromAddress(params.formattedAddress)
        : undefined;

    if (addressArea) {
        return {
            area: addressArea,
            matchedBy: "address" as const,
        };
    }

    if (
        typeof params.latitude === "number" &&
        typeof params.longitude === "number"
    ) {
        const geofenceMatch = findDeliveryAreaByCoordinates(params.latitude, params.longitude);
        if (geofenceMatch) {
            return {
                area: geofenceMatch.area,
                matchedBy: "geofence" as const,
                distanceKm: geofenceMatch.distanceKm,
            };
        }
    }

    return null;
}

export function validateDeliveryAreaSelection(params: {
    selectedArea: string;
    formattedAddress?: string;
    latitude?: number;
    longitude?: number;
}): DeliveryAreaValidationResult {
    const selectedArea = getDeliveryAreaByName(params.selectedArea);

    if (!selectedArea) {
        return {
            isValid: false,
            reason: "invalid_area",
            message: "Please select a valid delivery area.",
        };
    }

    const addressArea = params.formattedAddress
        ? detectDeliveryAreaFromAddress(params.formattedAddress)
        : undefined;

    if (addressArea && addressArea.name !== selectedArea.name) {
        return {
            isValid: false,
            reason: "address_mismatch",
            selectedArea,
            detectedArea: addressArea,
            message: "Your current location does not match the selected delivery area.",
        };
    }

    if (
        typeof params.latitude === "number" &&
        typeof params.longitude === "number"
    ) {
        const distanceKm = haversineDistanceKm(
            params.latitude,
            params.longitude,
            selectedArea.center.latitude,
            selectedArea.center.longitude
        );

        if (distanceKm <= selectedArea.radiusKm) {
            return {
                isValid: true,
                selectedArea,
                matchedBy: addressArea ? "address" : "geofence",
                distanceKm,
                message: "Location verified.",
            };
        }

        return {
            isValid: false,
            reason: "outside_geofence",
            selectedArea,
            distanceKm,
            message: "Your current location does not match the selected delivery area.",
        };
    }

    if (addressArea?.name === selectedArea.name) {
        return {
            isValid: true,
            selectedArea,
            matchedBy: "address",
            message: "Location verified.",
        };
    }

    return {
        isValid: false,
        reason: "missing_location",
        selectedArea,
        message: "Please use your current location to verify the delivery area.",
    };
}

export function matchArea(selectedArea: string, detectedArea: string): boolean {
    return validateDeliveryAreaSelection({
        selectedArea,
        formattedAddress: detectedArea,
    }).isValid;
}
