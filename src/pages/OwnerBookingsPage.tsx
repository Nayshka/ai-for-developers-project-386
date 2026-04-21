import { Badge, Card, Group, ScrollArea, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';

import { getErrorMessage } from '../shared/api/client';
import { useOwnerBookingsQuery } from '../shared/api/queries';
import { formatDateTime, formatTimeRange } from '../shared/lib/dateTime';
import { EmptyState } from '../shared/ui/EmptyState';
import { ErrorState } from '../shared/ui/ErrorState';
import { LoadingState } from '../shared/ui/LoadingState';

const bookingStatusLabel = {
  confirmed: 'Подтверждено',
  cancelled: 'Отменено',
};

export function OwnerBookingsPage() {
  const bookingsQuery = useOwnerBookingsQuery();
  const bookings = bookingsQuery.data?.items ?? [];
  const confirmedCount = bookings.filter((booking) => booking.status === 'confirmed').length;
  const totalDurationMinutes = bookings.reduce(
    (total, booking) => total + booking.eventType.durationMinutes,
    0,
  );
  const nextBooking = bookings
    .slice()
    .sort((left, right) => left.range.startAt.localeCompare(right.range.startAt))[0];

  return (
    <Stack gap="lg">
      <section className="page-hero">
        <Badge color="callBlue" variant="light">
          Предстоящие встречи
        </Badge>
        <Title order={2}>Бронирования</Title>
        <Text c="dimmed" maw={640}>
          Здесь будет список встреч с гостем, email, типом встречи, датой, временем и статусом.
        </Text>
      </section>

      {bookingsQuery.isLoading ? (
        <LoadingState message="Загружаем бронирования..." />
      ) : bookingsQuery.isError ? (
        <ErrorState message={getErrorMessage(bookingsQuery.error)} />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="Предстоящих встреч пока нет"
          message="Когда гость создаст бронирование, оно появится в этом списке."
        />
      ) : (
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Card className="surface-card booking-summary-card" padding="lg" radius="sm">
              <Text size="xs" c="dimmed" fw={700}>
                Всего встреч
              </Text>
              <Text className="booking-summary-value">{bookings.length}</Text>
            </Card>
            <Card className="surface-card booking-summary-card" padding="lg" radius="sm">
              <Text size="xs" c="dimmed" fw={700}>
                Подтверждено
              </Text>
              <Text className="booking-summary-value">{confirmedCount}</Text>
            </Card>
            <Card className="surface-card booking-summary-card" padding="lg" radius="sm">
              <Text size="xs" c="dimmed" fw={700}>
                Ближайший слот
              </Text>
              <Text className="booking-summary-value booking-summary-date">
                {nextBooking ? formatDateTime(nextBooking.range.startAt) : 'Нет встреч'}
              </Text>
              <Text size="sm" c="dimmed">
                Суммарно {totalDurationMinutes} мин запланировано
              </Text>
            </Card>
          </SimpleGrid>

          <Card className="surface-card bookings-table-card bookings-desktop" padding="lg" radius="sm">
            <Group justify="space-between" mb="md">
              <div>
                <Title order={3}>Список бронирований</Title>
                <Text c="dimmed" mt={4}>
                  Все предстоящие встречи по опубликованным типам.
                </Text>
              </div>
              <Badge color="callBlue" variant="light">
                {bookings.length}
              </Badge>
            </Group>

            <ScrollArea>
              <Table verticalSpacing="sm" miw={860}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Гость</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Тип встречи</Table.Th>
                    <Table.Th>Длительность</Table.Th>
                    <Table.Th>Дата</Table.Th>
                    <Table.Th>Время</Table.Th>
                    <Table.Th>Статус</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {bookings.map((booking) => (
                    <Table.Tr key={booking.id}>
                      <Table.Td>
                        <Text fw={800}>{booking.guest.name}</Text>
                      </Table.Td>
                      <Table.Td>{booking.guest.email}</Table.Td>
                      <Table.Td>{booking.eventType.name}</Table.Td>
                      <Table.Td>{booking.eventType.durationMinutes} мин</Table.Td>
                      <Table.Td>{formatDateTime(booking.range.startAt)}</Table.Td>
                      <Table.Td>{formatTimeRange(booking.range.startAt, booking.range.endAt)}</Table.Td>
                      <Table.Td>
                        <Badge
                          color={booking.status === 'confirmed' ? 'callBlue' : 'gray'}
                          variant="light"
                        >
                          {bookingStatusLabel[booking.status]}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Card>

          <div className="bookings-mobile-list">
            {bookings.map((booking) => (
              <Card className="surface-card booking-mobile-card" key={booking.id} padding="lg" radius="sm">
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Title order={4}>{booking.guest.name}</Title>
                      <Text c="dimmed" size="sm" mt={4}>
                        {booking.guest.email}
                      </Text>
                    </div>
                    <Badge color={booking.status === 'confirmed' ? 'callBlue' : 'gray'} variant="light">
                      {bookingStatusLabel[booking.status]}
                    </Badge>
                  </Group>

                  <div className="booking-mobile-meta-grid">
                    <div className="booking-mobile-meta-item">
                      <Text size="xs" c="dimmed" fw={700}>
                        Тип встречи
                      </Text>
                      <Text fw={800}>{booking.eventType.name}</Text>
                    </div>
                    <div className="booking-mobile-meta-item">
                      <Text size="xs" c="dimmed" fw={700}>
                        Длительность
                      </Text>
                      <Text fw={800}>{booking.eventType.durationMinutes} мин</Text>
                    </div>
                    <div className="booking-mobile-meta-item">
                      <Text size="xs" c="dimmed" fw={700}>
                        Дата
                      </Text>
                      <Text fw={800}>{formatDateTime(booking.range.startAt)}</Text>
                    </div>
                    <div className="booking-mobile-meta-item">
                      <Text size="xs" c="dimmed" fw={700}>
                        Время
                      </Text>
                      <Text fw={800}>{formatTimeRange(booking.range.startAt, booking.range.endAt)}</Text>
                    </div>
                  </div>
                </Stack>
              </Card>
            ))}
          </div>
        </Stack>
      )}
    </Stack>
  );
}
