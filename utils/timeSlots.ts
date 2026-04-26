export function getValidDates(startDate: Date, daysAhead: number = 5): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i <= daysAhead; i++) {
        const d = new Date(startDate);
        d.setHours(0, 0, 0, 0); // Normalize to midnight
        d.setDate(d.getDate() + i);
        dates.push(d);
    }
    return dates;
}

export const TIME_SLOTS = [
    { label: "Morning (9 AM - 12 PM)", startHour: 9 },
    { label: "Midday (12 PM - 3 PM)", startHour: 12 },
    { label: "Afternoon (3 PM - 6 PM)", startHour: 15 },
    { label: "Evening (6 PM - 9 PM)", startHour: 18 },
];

export function getSlotStartHour(timeStr: string): number | null {
    const slot = TIME_SLOTS.find(s => s.label === timeStr);
    if (slot) return slot.startHour;

    // Legacy support for older HH:MM AM/PM format
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s?(AM|PM|am|pm)$/i);
    if (match) {
        let hour = parseInt(match[1], 10);
        const ampm = match[3].toUpperCase();
        if (ampm === "PM" && hour < 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
        return hour;
    }
    return null;
}

export function getValidTimeSlots(
    isToday: boolean,
    minTimeStr?: string // Can be a new label or legacy time string
): string[] {
    const slots: string[] = [];
    const now = new Date();

    const minHourAllowedByConstraints = minTimeStr ? getSlotStartHour(minTimeStr) ?? 0 : 0;

    for (const slot of TIME_SLOTS) {
        // If scheduling for today, slot start time must be at least 1 hour from now
        if (isToday) {
            const currentHour = now.getHours();
            const minAllowedHour = currentHour + 1; // 1 hr buffer
            if (slot.startHour < minAllowedHour) continue;
        }

        // If minTimeStr is provided (e.g., delivery time on same day), pickup must be >= delivery slot
        if (slot.startHour < minHourAllowedByConstraints) {
            continue;
        }

        slots.push(slot.label);
    }
    return slots;
}

export function formatDateString(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
