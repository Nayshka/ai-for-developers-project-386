import type { AppStorage } from '../storage.js';
import { ApiError } from '../shared/errors.js';
import {
  addDays,
  addMinutes,
  bookingWindow,
  rangesOverlap,
  startOfToday,
  workdayRange,
} from '../shared/dateTime.js';
import type { Slot } from '../shared/types.js';

export function listEventTypeSlots(
  storage: AppStorage,
  eventTypeId: string,
  referenceDate = new Date(),
) {
  const eventType = storage.findEventType(eventTypeId);

  if (!eventType) {
    throw new ApiError(404, 'event_type_not_found');
  }

  const bookings = storage
    .listBookings()
    .filter((booking) => booking.status === 'confirmed')
    .map((booking) => ({
      start: new Date(booking.range.startAt),
      end: new Date(booking.range.endAt),
    }));
  const today = startOfToday(referenceDate);
  const slots: Slot[] = [];

  for (let dayOffset = 0; dayOffset < bookingWindow.days; dayOffset += 1) {
    const { start: workdayStart, end: workdayEnd } = workdayRange(addDays(today, dayOffset));

    for (
      let slotStart = workdayStart;
      addMinutes(slotStart, eventType.durationMinutes) <= workdayEnd;
      slotStart = addMinutes(slotStart, eventType.durationMinutes)
    ) {
      const slotEnd = addMinutes(slotStart, eventType.durationMinutes);
      const isAvailable = !bookings.some((booking) =>
        rangesOverlap({ start: slotStart, end: slotEnd }, booking),
      );

      if (slotStart >= referenceDate && isAvailable) {
        slots.push({
          eventTypeId,
          range: {
            startAt: slotStart.toISOString(),
            endAt: slotEnd.toISOString(),
          },
          isAvailable,
        });
      }
    }
  }

  return slots;
}
