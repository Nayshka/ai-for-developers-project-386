import type {
  Booking,
  BookingListResponse,
  CreateBookingForm,
  CreateEventTypeForm,
  ErrorResponse,
  EventType,
  EventTypeListResponse,
  GetSlotsQuery,
  ResourceId,
  SlotListResponse,
  UpdateEventTypeForm,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? window.location.origin;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly response?: ErrorResponse,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  query?: Record<string, string | undefined>;
};

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(path, API_BASE_URL);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as ErrorResponse).message === 'string'
  );
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : undefined;

  if (!response.ok) {
    const error = isErrorResponse(data) ? data : undefined;
    throw new ApiError(error?.message ?? 'Ошибка API', error, response.status);
  }

  if (isErrorResponse(data)) {
    throw new ApiError(data.message, data, response.status);
  }

  return data as T;
}

export const api = {
  listEventTypes() {
    return request<EventTypeListResponse>('/event-types');
  },

  getEventType(eventTypeId: ResourceId) {
    return request<EventType>(`/event-types/${eventTypeId}`);
  },

  listEventTypeSlots(eventTypeId: ResourceId, query?: GetSlotsQuery) {
    return request<SlotListResponse>(`/event-types/${eventTypeId}/slots`, {
      query,
    });
  },

  createBooking(body: CreateBookingForm) {
    return request<Booking>('/bookings', {
      method: 'POST',
      body,
    });
  },

  listOwnerEventTypes() {
    return request<EventTypeListResponse>('/owner/event-types');
  },

  createOwnerEventType(body: CreateEventTypeForm) {
    return request<EventType>('/owner/event-types', {
      method: 'POST',
      body,
    });
  },

  updateOwnerEventType(eventTypeId: ResourceId, body: UpdateEventTypeForm) {
    return request<EventType>(`/owner/event-types/${eventTypeId}`, {
      method: 'PATCH',
      body,
    });
  },

  listOwnerBookings() {
    return request<BookingListResponse>('/owner/bookings');
  },
};

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Неизвестная ошибка';
}
