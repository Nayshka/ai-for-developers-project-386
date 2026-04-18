import { Alert, Badge, Button, Card, Divider, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { type FormEvent, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getErrorMessage } from '../shared/api/client';
import {
  useCreateBookingMutation,
  useEventTypeQuery,
  useEventTypeSlotsQuery,
} from '../shared/api/queries';
import type { Booking, GuestInfo, Slot, TimeRange } from '../shared/api/types';
import { formatDate, formatDateTime, formatTimeRange } from '../shared/lib/dateTime';
import { EmptyState } from '../shared/ui/EmptyState';
import { ErrorState } from '../shared/ui/ErrorState';
import { LoadingState } from '../shared/ui/LoadingState';

type SlotGroup = {
  dateKey: string;
  label: string;
  slots: Slot[];
};

type BookingConfirmation = {
  eventTypeName: string;
  guest: GuestInfo;
  range: TimeRange;
};

function groupSlotsByDay(slots: Slot[]) {
  const groups = new Map<string, SlotGroup>();

  [...slots]
    .sort((left, right) => left.range.startAt.localeCompare(right.range.startAt))
    .forEach((slot) => {
      const start = new Date(slot.range.startAt);
      const dateKey = Number.isNaN(start.getTime())
        ? slot.range.startAt
        : start.toISOString().slice(0, 10);
      const group = groups.get(dateKey) ?? {
        dateKey,
        label: formatDate(start),
        slots: [],
      };

      group.slots.push(slot);
      groups.set(dateKey, group);
    });

  return Array.from(groups.values());
}

function toConfirmation(
  booking: Booking,
  fallbackEventTypeName: string | undefined,
  guest: GuestInfo,
  range: TimeRange,
): BookingConfirmation {
  return {
    eventTypeName: fallbackEventTypeName || booking.eventType.name || 'Встреча',
    guest,
    range,
  };
}

export function GuestBookingPage() {
  const { id } = useParams();
  const eventTypeQuery = useEventTypeQuery(id);
  const slotsQuery = useEventTypeSlotsQuery(id);
  const createBookingMutation = useCreateBookingMutation();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [bookedSlotKeys, setBookedSlotKeys] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const availableSlots = useMemo(
    () =>
      slotsQuery.data?.items.filter(
        (slot) => slot.isAvailable && !bookedSlotKeys.includes(slot.range.startAt),
      ) ?? [],
    [bookedSlotKeys, slotsQuery.data?.items],
  );
  const slotGroups = useMemo(() => groupSlotsByDay(availableSlots), [availableSlots]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id || !selectedSlot) {
      return;
    }

    const guest = {
      name: guestName.trim(),
      email: guestEmail.trim(),
    };
    const range = selectedSlot.range;

    createBookingMutation.mutate(
      {
        eventTypeId: id,
        range,
        guest,
      },
      {
        onSuccess: (booking) => {
          setBookedSlotKeys((keys) =>
            keys.includes(range.startAt) ? keys : [...keys, range.startAt],
          );
          setConfirmation(toConfirmation(booking, eventType?.name, guest, range));
          setSelectedSlot(null);
          setGuestName('');
          setGuestEmail('');
        },
      },
    );
  };

  const eventType = eventTypeQuery.data;
  const booking = confirmation;

  if (eventTypeQuery.isLoading || slotsQuery.isLoading) {
    return <LoadingState message="Загружаем встречу и свободные слоты..." />;
  }

  if (eventTypeQuery.isError) {
    return <ErrorState message={getErrorMessage(eventTypeQuery.error)} />;
  }

  if (slotsQuery.isError) {
    return <ErrorState message={getErrorMessage(slotsQuery.error)} />;
  }

  if (!eventType) {
    return (
      <EmptyState
        title="Тип встречи не найден"
        message="Вернитесь к списку и выберите другой формат встречи."
      />
    );
  }

  if (booking) {
    return (
      <Stack gap="lg">
        <Group>
          <Button
            onClick={() => setConfirmation(null)}
            variant="subtle"
            color="callBlue"
            w="fit-content"
          >
            Выбрать другое время
          </Button>
          <Button component={Link} to="/" variant="subtle" color="callBlue" w="fit-content">
            Вернуться к типам встреч
          </Button>
        </Group>

        <Card className="surface-card booking-success" padding="xl" radius="sm">
          <Stack gap="md">
            <Badge color="callBlue" variant="light" radius="sm" w="fit-content">
              Бронирование создано
            </Badge>
            <Title order={2}>Встреча успешно забронирована</Title>
            <Text c="dimmed">
              Email-уведомления в MVP не отправляются. Сохраните дату и время встречи у себя.
            </Text>

            <div className="confirmation-grid">
              <div className="confirmation-item">
                <Text size="xs" c="dimmed" fw={700}>
                  Тип встречи
                </Text>
                <Text fw={800}>{booking.eventTypeName}</Text>
              </div>
              <div className="confirmation-item">
                <Text size="xs" c="dimmed" fw={700}>
                  Дата и время
                </Text>
                <Text fw={800}>{formatDateTime(booking.range.startAt)}</Text>
              </div>
              <div className="confirmation-item">
                <Text size="xs" c="dimmed" fw={700}>
                  Гость
                </Text>
                <Text fw={800}>{booking.guest.name}</Text>
              </div>
              <div className="confirmation-item">
                <Text size="xs" c="dimmed" fw={700}>
                  Email
                </Text>
                <Text fw={800}>{booking.guest.email}</Text>
              </div>
            </div>

            <Group>
              <Button component={Link} to="/" color="callBlue">
                Новая запись
              </Button>
              <Button onClick={() => setConfirmation(null)} color="callBlue" variant="light">
                Выбрать еще слот
              </Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack gap="lg" className="booking-page">
      <Button component={Link} to="/" variant="subtle" color="callBlue" w="fit-content">
        Вернуться к типам встреч
      </Button>

      <section className="booking-grid">
        <Stack gap="md">
          <Card className="surface-card booking-details" padding="lg" radius="sm">
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Title order={2}>{eventType.name}</Title>
                  <Text c="dimmed" mt={6}>
                    {eventType.description || 'Описание для этого типа встречи не добавлено.'}
                  </Text>
                </div>
                <Badge color="callBlue" variant="light" radius="sm">
                  {eventType.durationMinutes} мин
                </Badge>
              </Group>

              <Divider />

              <Group className="booking-rule-row" justify="space-between">
                <Text c="dimmed" fw={700}>
                  Доступность
                </Text>
                <Text fw={800}>09:00-19:00, ближайшие 14 дней</Text>
              </Group>
            </Stack>
          </Card>

          {slotGroups.length === 0 ? (
            <EmptyState
              title="Свободных слотов пока нет"
              message="Попробуйте выбрать другой тип встречи или вернуться позже."
            />
          ) : (
            <Card className="surface-card" padding="lg" radius="sm">
              <Stack gap="lg">
                <div>
                  <Title order={3}>Свободные слоты</Title>
                  <Text c="dimmed" mt={4}>
                    Выберите один удобный интервал. Слоты, забронированные в этой сессии,
                    скрываются из списка.
                  </Text>
                </div>

                {slotGroups.map((group) => (
                  <Stack gap="sm" key={group.dateKey}>
                    <Text fw={800} className="slot-day-title">
                      {group.label}
                    </Text>
                    <div className="slot-button-grid">
                      {group.slots.map((slot) => {
                        const isSelected = selectedSlot?.range.startAt === slot.range.startAt;

                        return (
                          <button
                            className={isSelected ? 'slot-button selected' : 'slot-button'}
                            key={slot.range.startAt}
                            onClick={() => setSelectedSlot(slot)}
                            type="button"
                          >
                            {formatTimeRange(slot.range.startAt, slot.range.endAt)}
                          </button>
                        );
                      })}
                    </div>
                  </Stack>
                ))}
              </Stack>
            </Card>
          )}
        </Stack>

        <Card className="surface-card booking-form-card" padding="lg" radius="sm">
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <div>
                <Title order={3}>Данные для записи</Title>
                <Text c="dimmed" mt={4}>
                  Заполните имя и email, чтобы создать бронирование.
                </Text>
              </div>

              <div className="selected-summary">
                <Text size="xs" c="dimmed" fw={700}>
                  Выбранное время
                </Text>
                <Text fw={800}>
                  {selectedSlot ? formatDateTime(selectedSlot.range.startAt) : 'Слот не выбран'}
                </Text>
              </div>

              <TextInput
                label="Имя"
                placeholder="Анна"
                value={guestName}
                onChange={(event) => setGuestName(event.currentTarget.value)}
                required
              />
              <TextInput
                label="Email"
                placeholder="anna@example.com"
                type="email"
                value={guestEmail}
                onChange={(event) => setGuestEmail(event.currentTarget.value)}
                required
              />

              {createBookingMutation.isError ? (
                <Alert color="red" title="Не удалось создать бронирование">
                  {getErrorMessage(createBookingMutation.error)}
                </Alert>
              ) : null}

              <Button
                color="callBlue"
                disabled={!selectedSlot}
                loading={createBookingMutation.isPending}
                type="submit"
              >
                Забронировать
              </Button>
            </Stack>
          </form>
        </Card>
      </section>
    </Stack>
  );
}
