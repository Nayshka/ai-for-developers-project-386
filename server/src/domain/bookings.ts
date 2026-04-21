import type { AppStorage } from '../storage.js';
import { ApiError } from '../shared/errors.js';
import {
  isWithinBookingWindow,
  minutesBetween,
  parseDateTime,
  rangesOverlap,
} from '../shared/dateTime.js';
import type { Booking, CreateBookingForm } from '../shared/types.js';

function createBookingId() {
  return `booking-${crypto.randomUUID()}`;
}

export function listOwnerBookings(storage: AppStorage, referenceDate = new Date()) {
  return storage
    .listBookings()
    .filter((booking) => {
      const startAt = parseDateTime(booking.range.startAt);

      return booking.status === 'confirmed' && startAt !== null && startAt >= referenceDate;
    })
    .sort((left, right) => left.range.startAt.localeCompare(right.range.startAt));
}

export function createBooking(
  storage: AppStorage,
  form: CreateBookingForm,
  referenceDate = new Date(),
) {
  const eventType = storage.findEventType(form.eventTypeId);

  if (!eventType) {
    throw new ApiError(404, 'event_type_not_found');
  }

  const startAt = parseDateTime(form.range.startAt);
  const endAt = parseDateTime(form.range.endAt);

  if (!startAt || !endAt || startAt >= endAt) {
    throw new ApiError(400, 'invalid_time_range');
  }

  if (minutesBetween(startAt, endAt) !== eventType.durationMinutes) {
    throw new ApiError(409, 'slot_unavailable');
  }

  if (!isWithinBookingWindow(startAt, endAt, referenceDate)) {
    throw new ApiError(409, 'booking_out_of_range');
  }

  const overlapsExistingBooking = storage
    .listBookings()
    .filter((booking) => booking.status === 'confirmed')
    .some((booking) =>
      rangesOverlap(
        { start: startAt, end: endAt },
        { start: new Date(booking.range.startAt), end: new Date(booking.range.endAt) },
      ),
    );

  if (overlapsExistingBooking) {
    throw new ApiError(409, 'slot_unavailable');
  }

  const booking: Booking = {
    id: createBookingId(),
    eventTypeId: eventType.id,
    eventType: {
      id: eventType.id,
      name: eventType.name,
      durationMinutes: eventType.durationMinutes,
    },
    guest: {
      name: form.guest.name.trim(),
      email: form.guest.email.trim(),
    },
    range: {
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
    },
    status: 'confirmed',
    createdAt: referenceDate.toISOString(),
  };

  return storage.createBooking(booking);
}
