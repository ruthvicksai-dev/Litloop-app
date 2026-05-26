import { describe, expect, it, vi, beforeEach } from "vitest";
import { getReliableCurrentLocation } from "../../../utils/location/current";
import * as Location from "expo-location";
import { Platform } from "react-native";

// Mock expo-device
vi.mock("expo-device", () => ({
    isDevice: true,
}));

// Mock the expo-location module
vi.mock("expo-location", () => ({
    hasServicesEnabledAsync: vi.fn(),
    getForegroundPermissionsAsync: vi.fn(),
    requestForegroundPermissionsAsync: vi.fn(),
    getProviderStatusAsync: vi.fn(),
    enableNetworkProviderAsync: vi.fn(),
    getCurrentPositionAsync: vi.fn(),
    getLastKnownPositionAsync: vi.fn(),
    watchPositionAsync: vi.fn(),
    Accuracy: { Balanced: 3, Low: 1 },
    PermissionStatus: {
        GRANTED: "granted",
        DENIED: "denied",
        UNDETERMINED: "undetermined",
    }
}));

// Mock Platform to avoid emulator checks failing tests
vi.mock("react-native", () => ({
    Platform: { OS: "ios" },
}));

describe("Location Utils", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default passing conditions for permissions
        vi.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(true);
        vi.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue({
            status: Location.PermissionStatus.GRANTED,
            granted: true,
            canAskAgain: true,
            expires: "never",
        } as any);
        vi.mocked(Location.getProviderStatusAsync).mockResolvedValue({
            locationServicesEnabled: true,
            gpsAvailable: true,
            networkAvailable: true,
            passiveAvailable: true
        } as any);
    });

    it("should successfully return a location on the first try", async () => {
        const mockLocation = {
            coords: { latitude: 37.7749, longitude: -122.4194, altitude: null, accuracy: 5, altitudeAccuracy: null, heading: null, speed: null },
            timestamp: 123456789,
        };

        vi.mocked(Location.getCurrentPositionAsync).mockResolvedValue(mockLocation as any);

        const result = await getReliableCurrentLocation();

        expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockLocation);
    });

    it("should request permissions if they are not already granted", async () => {
        const mockLocation = {
            coords: { latitude: 37.7749, longitude: -122.4194, altitude: null, accuracy: 5, altitudeAccuracy: null, heading: null, speed: null },
            timestamp: 123456789,
        };

        // Simulate permission not granted initially
        vi.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue({
            status: Location.PermissionStatus.UNDETERMINED,
            granted: false,
            canAskAgain: true,
            expires: "never",
        } as any);

        // Simulate user accepting the permission prompt
        vi.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
            status: Location.PermissionStatus.GRANTED,
            granted: true,
            canAskAgain: true,
            expires: "never",
        } as any);

        vi.mocked(Location.getCurrentPositionAsync).mockResolvedValue(mockLocation as any);

        const result = await getReliableCurrentLocation();

        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockLocation);
    });

    it("should throw a user-friendly error if permission is denied", async () => {
        vi.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue({
            status: Location.PermissionStatus.DENIED,
            granted: false,
            canAskAgain: true,
            expires: "never",
        } as any);

        vi.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
            status: Location.PermissionStatus.DENIED,
            granted: false,
            canAskAgain: true,
            expires: "never",
        } as any);

        await expect(getReliableCurrentLocation()).rejects.toThrow("Permission to access location was denied");
    });

    it("should fallback to lower accuracy if balanced accuracy fails", async () => {
        const mockLocation = {
            coords: { latitude: 37.7749, longitude: -122.4194, altitude: null, accuracy: 100, altitudeAccuracy: null, heading: null, speed: null },
            timestamp: 123456789,
        };

        // Fail the first high-accuracy request
        vi.mocked(Location.getCurrentPositionAsync)
            .mockRejectedValueOnce(new Error("Timeout"))
            .mockResolvedValueOnce(mockLocation as any); // Succeed on the low-accuracy fallback

        const result = await getReliableCurrentLocation();

        expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(2);
        expect(result).toEqual(mockLocation);
    });

    it("should fallback to last known location if both current position requests fail", async () => {
        const mockLocation = {
            coords: { latitude: 37.7749, longitude: -122.4194, altitude: null, accuracy: 500, altitudeAccuracy: null, heading: null, speed: null },
            timestamp: 123456789,
        };

        // Fail both current position requests
        vi.mocked(Location.getCurrentPositionAsync).mockRejectedValue(new Error("Timeout"));
        
        // Succeed on last known location
        vi.mocked(Location.getLastKnownPositionAsync).mockResolvedValue(mockLocation as any);

        const result = await getReliableCurrentLocation();

        expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(2);
        expect(Location.getLastKnownPositionAsync).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockLocation);
    });
});
