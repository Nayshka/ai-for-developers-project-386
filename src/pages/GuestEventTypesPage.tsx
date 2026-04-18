import { Badge, Button, Card, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

import { getErrorMessage } from '../shared/api/client';
import { useEventTypesQuery } from '../shared/api/queries';
import { EmptyState } from '../shared/ui/EmptyState';
import { ErrorState } from '../shared/ui/ErrorState';
import { LoadingState } from '../shared/ui/LoadingState';

const rules = [
  { label: 'Окно', value: '09:00-19:00' },
  { label: 'Горизонт', value: '14 дней' },
  { label: 'Время', value: 'локальное' },
];

const previewSlots = [
  { time: '09:30', label: '30 мин' },
  { time: '11:00', label: 'Доступно', active: true },
  { time: '14:30', label: '60 мин' },
];

export function GuestEventTypesPage() {
  const eventTypesQuery = useEventTypesQuery();
  const eventTypes = eventTypesQuery.data?.items ?? [];

  return (
    <Stack gap="xl" className="guest-page">
      <section className="guest-hero">
        <div className="guest-hero-copy">
          <Badge color="callBlue" variant="light" radius="sm">
            Рабочее окно 09:00-19:00
          </Badge>
          <Title order={2}>Выберите удобный формат встречи</Title>
          <Text c="dimmed" maw={640}>
            Выберите тип встречи, затем свободный слот на ближайшие 14 дней. Время
            показывается в вашем локальном часовом поясе.
          </Text>

          <div className="rules-strip" aria-label="Правила записи">
            {rules.map((rule) => (
              <div className="rule-item" key={rule.label}>
                <Text size="xs" c="dimmed" fw={700}>
                  {rule.label}
                </Text>
                <Text fw={800}>{rule.value}</Text>
              </div>
            ))}
          </div>
        </div>

        <aside className="availability-preview" aria-label="Ближайшие слоты">
          <Group justify="space-between" align="flex-start" mb="sm">
            <div>
              <Text size="sm" fw={800}>
                Ближайшие слоты
              </Text>
              <Text size="sm" c="dimmed">
                Сегодня
              </Text>
            </div>
            <Badge color="callBlue" variant="light" radius="sm">
              UTC+3
            </Badge>
          </Group>

          <Stack gap="xs">
            {previewSlots.map((slot) => (
              <div className={slot.active ? 'slot-preview active' : 'slot-preview'} key={slot.time}>
                <Text fw={800}>{slot.time}</Text>
                <Text size="sm" c={slot.active ? 'callBlue.7' : 'dimmed'} fw={700}>
                  {slot.label}
                </Text>
              </div>
            ))}
          </Stack>
        </aside>
      </section>

      {eventTypesQuery.isLoading ? (
        <LoadingState message="Загружаем типы встреч..." />
      ) : eventTypesQuery.isError ? (
        <ErrorState message={getErrorMessage(eventTypesQuery.error)} />
      ) : eventTypes.length === 0 ? (
        <EmptyState
          title="Типы встреч пока не созданы"
          message="Когда владелец добавит хотя бы один формат встречи, он появится здесь."
        />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" className="event-type-grid">
          {eventTypes.map((eventType) => (
            <Card
              key={eventType.id}
              className="surface-card event-type-card"
              padding="lg"
              radius="sm"
            >
              <Stack gap="lg" h="100%">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={6}>
                    <Title order={3}>{eventType.name}</Title>
                    <Text c="dimmed">
                      {eventType.description || 'Описание для этого типа встречи не добавлено.'}
                    </Text>
                  </Stack>
                  <Badge variant="light" color="callBlue">
                    {eventType.durationMinutes} мин
                  </Badge>
                </Group>

                <Group className="event-meta" justify="space-between">
                  <Text size="sm" c="dimmed" fw={700}>
                    Слоты
                  </Text>
                  <Text size="sm" fw={800}>
                    ближайшие 14 дней
                  </Text>
                </Group>

                <Button
                  component={Link}
                  to={`/event-types/${eventType.id}`}
                  color="callBlue"
                  mt="auto"
                >
                  Выбрать время
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
