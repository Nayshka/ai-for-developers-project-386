import type { AppStorage } from '../storage.js';
import { ApiError } from '../shared/errors.js';
import type { CreateEventTypeForm, UpdateEventTypeForm } from '../shared/types.js';

function buildEventTypeId(name: string, existingIds: Set<string>) {
  const baseId = name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/giu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const fallbackId = `event-type-${Date.now().toString(36)}`;
  const normalizedId = baseId || fallbackId;
  let id = normalizedId;
  let counter = 2;

  while (existingIds.has(id)) {
    id = `${normalizedId}-${counter}`;
    counter += 1;
  }

  return id;
}

export function listEventTypes(storage: AppStorage) {
  return storage.listEventTypes();
}

export function getEventType(storage: AppStorage, eventTypeId: string) {
  const eventType = storage.findEventType(eventTypeId);

  if (!eventType) {
    throw new ApiError(404, 'event_type_not_found');
  }

  return eventType;
}

export function createEventType(storage: AppStorage, form: CreateEventTypeForm) {
  const now = new Date().toISOString();
  const existingIds = new Set(storage.listEventTypes().map((eventType) => eventType.id));
  const eventType = {
    id: buildEventTypeId(form.name, existingIds),
    name: form.name.trim(),
    description: form.description?.trim() || undefined,
    durationMinutes: form.durationMinutes,
    createdAt: now,
    updatedAt: now,
  };

  return storage.createEventType(eventType);
}

export function updateEventType(storage: AppStorage, eventTypeId: string, form: UpdateEventTypeForm) {
  const current = getEventType(storage, eventTypeId);
  const updated = storage.updateEventType(eventTypeId, {
    name: form.name?.trim() ?? current.name,
    description:
      form.description === undefined ? current.description : form.description.trim() || undefined,
    durationMinutes: form.durationMinutes ?? current.durationMinutes,
    updatedAt: new Date().toISOString(),
  });

  if (!updated) {
    throw new ApiError(404, 'event_type_not_found');
  }

  return updated;
}
