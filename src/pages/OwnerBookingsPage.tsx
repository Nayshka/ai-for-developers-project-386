import { Badge, Card, Group, ScrollArea, Stack, Table, Text, Title } from '@mantine/core';

import { getErrorMessage } from '../shared/api/client';
import { useOwnerBookingsQuery } from '../shared/api/queries';
import { formatDateTime, formatTimeRange } from '../shared/lib/dateTime';
import { EmptyState } from '../shared/ui/EmptyState';
import { ErrorState } from '../shared/ui/ErrorState';
import { LoadingState } from '../shared/ui/LoadingState';

export function OwnerBookingsPage() {
  const bookingsQuery = useOwnerBookingsQuery();
  const bookings = bookingsQuery.data?.items ?? [];

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
        <Card className="surface-card bookings-table-card" padding="lg" radius="sm">
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
            <Table verticalSpacing="sm" miw={760}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Гость</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Тип встречи</Table.Th>
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
                    <Table.Td>{formatDateTime(booking.range.startAt)}</Table.Td>
                    <Table.Td>{formatTimeRange(booking.range.startAt, booking.range.endAt)}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={booking.status === 'confirmed' ? 'callBlue' : 'gray'}
                        variant="light"
                      >
                        {booking.status}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Card>
      )}
    </Stack>
  );
}
