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

export function getValidTimeSlots(
    isToday: boolean,
    minTimeStr?: string // "HH:MM AM/PM" format
): string[] {
    const slots: string[] = [];
    const now = new Date();

    // Bounds: 6:00 AM to 10:00 PM (22:00)
    const startHour = 6;
    const endHour = 22;

    for (let h = startHour; h <= endHour; h++) {
        for (let m of [0, 30]) {
            // Check current time buffer (1 hr) if today
            if (isToday) {
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                const slotMinutes = h * 60 + m;
                const minAllowedMinutes = currentHour * 60 + currentMinute + 60; // 1 hr buffer
                if (slotMinutes < minAllowedMinutes) continue;
            }

            // Check minimum time constraint if provided
            if (minTimeStr) {
                const parsedMin = parseTimeString(minTimeStr);
                if (parsedMin) {
                    const slotMinutes = h * 60 + m;
                    const minAllowedMinutes = parsedMin.hour * 60 + parsedMin.minute;
                    if (slotMinutes < minAllowedMinutes) continue;
                }
            }

            slots.push(formatTimeSlot(h, m));
        }
    }
    return slots;
}

export function parseTimeString(timeStr: string): { hour: number; minute: number } | null {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s?(AM|PM|am|pm)$/i);
    if (!match) return null;
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();

    if (ampm === "PM" && hour < 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;

    return { hour, minute };
}

export function formatTimeSlot(hour24: number, minute: number): string {
    const isPM = hour24 >= 12;
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const minuteStr = minute === 0 ? "00" : "30";
    const ampm = isPM ? "PM" : "AM";
    return `${hour12.toString().padStart(2, "0")}:${minuteStr} ${ampm}`;
}

export function formatDateString(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
