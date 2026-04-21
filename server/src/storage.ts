import type { Booking, EventType } from './shared/types.js';

type StorageState = {
  eventTypes: EventType[];
  bookings: Booking[];
};

const seedEventTypes: EventType[] = [
  {
    id: 'consultation',
    name: 'Консультация',
    description: 'Короткий созвон для обсуждения вопроса и следующих шагов.',
    durationMinutes: 30,
    createdAt: '2026-04-18T06:00:00.000Z',
    updatedAt: '2026-04-18T06:00:00.000Z',
  },
  {
    id: 'demo',
    name: 'Демонстрация',
    description: 'Подробная встреча с показом продукта и ответами на вопросы.',
    durationMinutes: 60,
    createdAt: '2026-04-18T06:15:00.000Z',
    updatedAt: '2026-04-18T06:15:00.000Z',
  },
];

function cloneEventType(eventType: EventType): EventType {
  return { ...eventType };
}

function cloneBooking(booking: Booking): Booking {
  return {
    ...booking,
    eventType: { ...booking.eventType },
    guest: { ...booking.guest },
    range: { ...booking.range },
  };
}

export function createStorage(seed?: Partial<StorageState>) {
  const state: StorageState = {
    eventTypes: seed?.eventTypes?.map(cloneEventType) ?? seedEventTypes.map(cloneEventType),
    bookings: seed?.bookings?.map(cloneBooking) ?? [],
  };

  return {
    listEventTypes() {
      return state.eventTypes.map(cloneEventType);
    },

    findEventType(eventTypeId: string) {
      const eventType = state.eventTypes.find((item) => item.id === eventTypeId);
      return eventType ? cloneEventType(eventType) : undefined;
    },

    createEventType(eventType: EventType) {
      state.eventTypes.unshift(cloneEventType(eventType));
      return cloneEventType(eventType);
    },

    updateEventType(eventTypeId: string, patch: Partial<EventType>) {
      const index = state.eventTypes.findIndex((item) => item.id === eventTypeId);

      if (index === -1) {
        return undefined;
      }

      state.eventTypes[index] = {
        ...state.eventTypes[index],
        ...patch,
        id: eventTypeId,
      };

      return cloneEventType(state.eventTypes[index]);
    },

    listBookings() {
      return state.bookings.map(cloneBooking);
    },

    createBooking(booking: Booking) {
      state.bookings.push(cloneBooking(booking));
      return cloneBooking(booking);
    },
  };
}

export type AppStorage = ReturnType<typeof createStorage>;
