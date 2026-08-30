/**
 * Semver-like version comparison utility.
 *
 * Compares two version strings in "major.minor.patch" format.
 * Returns: -1 (a < b), 0 (a === b), 1 (a > b)
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
    const partsA = a.split(".").map(Number);
    const partsB = b.split(".").map(Number);
    const len = Math.max(partsA.length, partsB.length);

    for (let i = 0; i < len; i++) {
        const numA = partsA[i] ?? 0;
        const numB = partsB[i] ?? 0;
        if (numA < numB) return -1;
        if (numA > numB) return 1;
    }

    return 0;
}

/**
 * Returns true if currentVersion is strictly older than minVersion.
 */
export function isAppOutdated(currentVersion: string, minVersion: string): boolean {
    return compareVersions(currentVersion, minVersion) < 0;
}
