const dayInMs = 24 * 60 * 60 * 1000;

export const bookingWindow = {
  days: 14,
  workdayStartHour: 9,
  workdayEndHour: 19,
};

export function parseDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function minutesBetween(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / 60_000;
}

export function startOfToday(referenceDate = new Date()) {
  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    0,
    0,
    0,
    0,
  );
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * dayInMs);
}

export function workdayRange(dayStart: Date) {
  const start = new Date(dayStart);
  start.setHours(bookingWindow.workdayStartHour, 0, 0, 0);

  const end = new Date(dayStart);
  end.setHours(bookingWindow.workdayEndHour, 0, 0, 0);

  return { start, end };
}

export function rangesOverlap(
  left: { start: Date; end: Date },
  right: { start: Date; end: Date },
) {
  return left.start < right.end && right.start < left.end;
}

export function isWithinBookingWindow(start: Date, end: Date, referenceDate = new Date()) {
  const today = startOfToday(referenceDate);
  const maxEnd = addDays(today, bookingWindow.days);
  const dayStart = startOfToday(start);
  const workday = workdayRange(dayStart);

  return start >= referenceDate && end <= maxEnd && start >= workday.start && end <= workday.end;
}
