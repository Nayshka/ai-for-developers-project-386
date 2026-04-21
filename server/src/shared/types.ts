export type ResourceId = string;
export type UtcDateTime = string;

export type TimeRange = {
  startAt: UtcDateTime;
  endAt: UtcDateTime;
};

export type GuestInfo = {
  name: string;
  email: string;
};

export type EventTypeSnapshot = {
  id: ResourceId;
  name: string;
  durationMinutes: number;
};

export type EventType = {
  id: ResourceId;
  name: string;
  description?: string;
  durationMinutes: number;
  createdAt: UtcDateTime;
  updatedAt: UtcDateTime;
};

export type BookingStatus = 'confirmed' | 'cancelled';

export type Booking = {
  id: ResourceId;
  eventTypeId: ResourceId;
  eventType: EventTypeSnapshot;
  guest: GuestInfo;
  range: TimeRange;
  status: BookingStatus;
  createdAt: UtcDateTime;
};

export type Slot = {
  eventTypeId: ResourceId;
  range: TimeRange;
  isAvailable: boolean;
};

export type CreateEventTypeForm = {
  name: string;
  description?: string;
  durationMinutes: number;
};

export type UpdateEventTypeForm = Partial<CreateEventTypeForm>;

export type CreateBookingForm = {
  eventTypeId: ResourceId;
  range: TimeRange;
  guest: GuestInfo;
};

export type ApiErrorCode =
  | 'validation_error'
  | 'event_type_not_found'
  | 'booking_not_found'
  | 'slot_unavailable'
  | 'booking_overlap'
  | 'booking_out_of_range'
  | 'invalid_time_range'
  | 'internal_error';

export type ErrorResponse = {
  code: ApiErrorCode;
  message: string;
  details?: string[];
};
