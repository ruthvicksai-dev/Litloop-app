import * as Device from "expo-device";
import * as Location from "expo-location";
import { Platform } from "react-native";

const ANDROID_EMULATOR_LOCATION_HELP =
    "Location fix not available in the emulator. Enable Settings > Location > Use location, turn off Google Location Accuracy / Improve Location Accuracy, then set the emulator GPS location again.";

async function getWatchPositionFix(timeoutMs = 5000): Promise<Location.LocationObject | null> {
    return new Promise((resolve) => {
        let subscription: Location.LocationSubscription | null = null;

        const cleanup = (result: Location.LocationObject | null) => {
            if (subscription) {
                subscription.remove();
            }
            resolve(result);
        };

        const timer = setTimeout(() => cleanup(null), timeoutMs);

        void Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.Balanced,
                distanceInterval: 0,
                timeInterval: 1000,
                mayShowUserSettingsDialog: true,
            },
            (location) => {
                clearTimeout(timer);
                cleanup(location);
            }
        )
            .then((nextSubscription) => {
                subscription = nextSubscription;
            })
            .catch(() => {
                clearTimeout(timer);
                cleanup(null);
            });
    });
}

export async function getReliableCurrentLocation(): Promise<Location.LocationObject> {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
        throw new Error("Please enable location services in your device settings.");
    }

    const existingPermission = await Location.getForegroundPermissionsAsync();
    if (existingPermission.status !== "granted" && !existingPermission.canAskAgain) {
        throw new Error("Location permission is permanently denied. Enable it in Settings.");
    }

    const { status } =
        existingPermission.status === "granted"
            ? existingPermission
            : await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
        throw new Error("Permission to access location was denied");
    }

    const providerStatus = await Location.getProviderStatusAsync();
    const isAndroidEmulator = Platform.OS === "android" && !Device.isDevice;

    if (
        Platform.OS === "android" &&
        !isAndroidEmulator &&
        providerStatus.locationServicesEnabled &&
        !providerStatus.gpsAvailable &&
        !providerStatus.networkAvailable
    ) {
        try {
            await Location.enableNetworkProviderAsync();
        } catch {
            // If the user declines the provider dialog, the direct location request below can still succeed.
        }
    }

    let location: Location.LocationObject | null = null;

    try {
        location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            mayShowUserSettingsDialog: true,
        });
    } catch (error) {
        console.warn("[Location] Current position unavailable, trying lower-accuracy fallback...", error);
    }

    if (!location) {
        try {
            location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Low,
                mayShowUserSettingsDialog: true,
            });
        } catch (error) {
            console.warn("[Location] Lower-accuracy current position unavailable, trying last known position...", error);
        }
    }

    if (!location) {
        location = await Location.getLastKnownPositionAsync({
            maxAge: 15 * 60 * 1000,
            requiredAccuracy: 5000,
        });
    }

    if (!location) {
        location = await getWatchPositionFix();
    }

    if (!location) {
        if (isAndroidEmulator) {
            throw new Error(ANDROID_EMULATOR_LOCATION_HELP);
        }

        throw new Error(
            "Could not determine your current location. Make sure GPS is on, then try again in an open area or near a window."
        );
    }

    return location;
}
