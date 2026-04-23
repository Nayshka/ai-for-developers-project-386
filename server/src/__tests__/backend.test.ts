import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../app.js';
import type { buildApp as buildAppType } from '../app.js';
import { createStorage } from '../storage.js';

type TestApp = ReturnType<typeof buildAppType>;

const referenceDate = new Date('2026-04-21T12:00:00.000Z');

function workSlotAtHour(hour: number, durationMinutes: number) {
  const start = new Date(referenceDate);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  return { startAt: start.toISOString(), endAt: end.toISOString() };
}

function workSlotAtMinute(hour: number, minute: number, durationMinutes: number) {
  const start = new Date(referenceDate);
  start.setHours(hour, minute, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  return { startAt: start.toISOString(), endAt: end.toISOString() };
}

function workSlotOnDay(dayOffset: number, hour: number, durationMinutes: number) {
  const start = new Date(referenceDate);
  start.setDate(start.getDate() + dayOffset);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  return { startAt: start.toISOString(), endAt: end.toISOString() };
}

function nextWorkSlot(durationMinutes: number) {
  return workSlotAtHour(16, durationMinutes);
}

function pastWorkSlot(durationMinutes: number) {
  return workSlotAtHour(9, durationMinutes);
}

function outsideWorkSlot(durationMinutes: number) {
  return workSlotAtHour(3, durationMinutes);
}

describe('backend API', () => {
  let app: TestApp;

  beforeEach(async () => {
    app = buildApp({ now: () => referenceDate });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns guest event types', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/event-types',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'consultation',
          name: 'Консультация',
          durationMinutes: 30,
        }),
      ]),
    );
  });

  it('creates and updates owner event types', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/owner/event-types',
      payload: {
        name: 'Разбор проекта',
        description: 'Встреча для обсуждения учебного проекта',
        durationMinutes: 45,
      },
    });

    expect(createResponse.statusCode).toBe(200);
    const created = createResponse.json();
    expect(created).toMatchObject({
      name: 'Разбор проекта',
      durationMinutes: 45,
    });

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/owner/event-types/${created.id}`,
      payload: {
        name: 'Разбор backend-проекта',
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      id: created.id,
      name: 'Разбор backend-проекта',
      durationMinutes: 45,
    });
  });

  it('allows PATCH requests from the frontend through CORS preflight', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/owner/event-types/consultation',
      headers: {
        origin: 'http://localhost:5174',
        'access-control-request-method': 'PATCH',
        'access-control-request-headers': 'content-type',
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-methods']).toContain('PATCH');
  });

  it('returns available slots for an event type', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/event-types/consultation/slots',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items[0]).toMatchObject({
      eventTypeId: 'consultation',
      isAvailable: true,
    });
    expect(new Date(body.items[0].range.startAt).getTime()).toBeGreaterThanOrEqual(
      referenceDate.getTime(),
    );
  });

  it('does not expose past slots for the current day', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/event-types/consultation/slots',
    });

    expect(response.statusCode).toBe(200);
    expect(
      response.json().items.every(
        (slot: { range: { startAt: string } }) =>
          new Date(slot.range.startAt).getTime() >= referenceDate.getTime(),
      ),
    ).toBe(true);
  });

  it('creates a booking and exposes it to owner bookings', async () => {
    const range = nextWorkSlot(30);
    const createResponse = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        eventTypeId: 'consultation',
        range,
        guest: {
          name: 'Анна',
          email: 'anna@example.com',
        },
      },
    });

    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.json()).toMatchObject({
      eventTypeId: 'consultation',
      eventType: {
        name: 'Консультация',
        durationMinutes: 30,
      },
      guest: {
        name: 'Анна',
        email: 'anna@example.com',
      },
      range,
      status: 'confirmed',
    });

    const bookingsResponse = await app.inject({
      method: 'GET',
      url: '/owner/bookings',
    });

    expect(bookingsResponse.statusCode).toBe(200);
    expect(bookingsResponse.json().items).toHaveLength(1);
  });

  it('does not return a booked slot as available', async () => {
    const range = nextWorkSlot(30);
    const createResponse = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        eventTypeId: 'consultation',
        range,
        guest: {
          name: 'Анна',
          email: 'anna@example.com',
        },
      },
    });

    expect(createResponse.statusCode).toBe(200);

    const slotsResponse = await app.inject({
      method: 'GET',
      url: '/event-types/consultation/slots',
    });

    expect(slotsResponse.statusCode).toBe(200);
    expect(
      slotsResponse
        .json()
        .items.some((slot: { range: { startAt: string } }) => slot.range.startAt === range.startAt),
    ).toBe(false);
  });

  it('rejects an already booked slot', async () => {
    const range = nextWorkSlot(30);
    const payload = {
      eventTypeId: 'consultation',
      range,
      guest: {
        name: 'Анна',
        email: 'anna@example.com',
      },
    };

    const firstResponse = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload,
    });
    const secondResponse = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        ...payload,
        guest: {
          name: 'Иван',
          email: 'ivan@example.com',
        },
      },
    });

    expect(firstResponse.statusCode).toBe(200);
    expect(secondResponse.statusCode).toBe(409);
    expect(secondResponse.json()).toMatchObject({
      code: 'slot_unavailable',
      message: 'Выбранный слот уже недоступен.',
    });
  });

  it('rejects partially overlapping bookings', async () => {
    const existingRange = nextWorkSlot(30);
    const overlappingRange = workSlotAtMinute(16, 15, 30);

    const firstResponse = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        eventTypeId: 'consultation',
        range: existingRange,
        guest: {
          name: 'Анна',
          email: 'anna@example.com',
        },
      },
    });
    const secondResponse = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        eventTypeId: 'consultation',
        range: overlappingRange,
        guest: {
          name: 'Иван',
          email: 'ivan@example.com',
        },
      },
    });

    expect(firstResponse.statusCode).toBe(200);
    expect(secondResponse.statusCode).toBe(409);
    expect(secondResponse.json()).toMatchObject({
      code: 'slot_unavailable',
    });
  });

  it('rejects overlapping bookings across different event types', async () => {
    const existingRange = nextWorkSlot(30);
    const overlappingRange = workSlotAtHour(16, 60);

    const firstResponse = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        eventTypeId: 'consultation',
        range: existingRange,
        guest: {
          name: 'Анна',
          email: 'anna@example.com',
        },
      },
    });
    const secondResponse = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        eventTypeId: 'demo',
        range: overlappingRange,
        guest: {
          name: 'Иван',
          email: 'ivan@example.com',
        },
      },
    });

    expect(firstResponse.statusCode).toBe(200);
    expect(secondResponse.statusCode).toBe(409);
    expect(secondResponse.json()).toMatchObject({
      code: 'slot_unavailable',
    });
  });

  it('rejects booking for missing event type', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        eventTypeId: 'missing',
        range: nextWorkSlot(30),
        guest: {
          name: 'Анна',
          email: 'anna@example.com',
        },
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      code: 'event_type_not_found',
    });
  });

  it('rejects booking outside the working window', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        eventTypeId: 'consultation',
        range: outsideWorkSlot(30),
        guest: {
          name: 'Анна',
          email: 'anna@example.com',
        },
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      code: 'booking_out_of_range',
    });
  });

  it('rejects booking for a past slot on the current day', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        eventTypeId: 'consultation',
        range: pastWorkSlot(30),
        guest: {
          name: 'Анна',
          email: 'anna@example.com',
        },
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      code: 'booking_out_of_range',
    });
  });

  it('rejects booking beyond the availability horizon', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        eventTypeId: 'consultation',
        range: workSlotOnDay(14, 9, 30),
        guest: {
          name: 'Анна',
          email: 'anna@example.com',
        },
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      code: 'booking_out_of_range',
    });
  });

  it('rejects booking with a duration that differs from the event type', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        eventTypeId: 'consultation',
        range: nextWorkSlot(45),
        guest: {
          name: 'Анна',
          email: 'anna@example.com',
        },
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      code: 'slot_unavailable',
    });
  });

  it.each([
    {
      caseName: 'missing guest name',
      payload: {
        eventTypeId: 'consultation',
        range: nextWorkSlot(30),
        guest: {
          name: '',
          email: 'anna@example.com',
        },
      },
    },
    {
      caseName: 'invalid guest email',
      payload: {
        eventTypeId: 'consultation',
        range: nextWorkSlot(30),
        guest: {
          name: 'Анна',
          email: 'not-an-email',
        },
      },
    },
    {
      caseName: 'invalid range date',
      payload: {
        eventTypeId: 'consultation',
        range: {
          startAt: 'not-a-date',
          endAt: nextWorkSlot(30).endAt,
        },
        guest: {
          name: 'Анна',
          email: 'anna@example.com',
        },
      },
    },
  ])('rejects invalid booking payload: $caseName', async ({ payload }) => {
    const response = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: 'validation_error',
    });
  });

  it('returns only upcoming owner bookings', async () => {
    await app.close();

    const storage = createStorage({
      bookings: [
        {
          id: 'booking-past',
          eventTypeId: 'consultation',
          eventType: {
            id: 'consultation',
            name: 'Консультация',
            durationMinutes: 30,
          },
          guest: {
            name: 'Анна',
            email: 'anna@example.com',
          },
          range: pastWorkSlot(30),
          status: 'confirmed',
          createdAt: '2026-04-20T08:00:00.000Z',
        },
        {
          id: 'booking-future',
          eventTypeId: 'consultation',
          eventType: {
            id: 'consultation',
            name: 'Консультация',
            durationMinutes: 30,
          },
          guest: {
            name: 'Иван',
            email: 'ivan@example.com',
          },
          range: nextWorkSlot(30),
          status: 'confirmed',
          createdAt: '2026-04-20T08:30:00.000Z',
        },
      ],
    });
    app = buildApp({ storage, now: () => referenceDate });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/owner/bookings',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().items).toEqual([
      expect.objectContaining({
        id: 'booking-future',
      }),
    ]);
  });
});
