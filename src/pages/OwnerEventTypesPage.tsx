import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  NumberInput,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { type FormEvent, useMemo, useState } from 'react';

import { getErrorMessage } from '../shared/api/client';
import {
  useCreateOwnerEventTypeMutation,
  useOwnerEventTypesQuery,
  useUpdateOwnerEventTypeMutation,
} from '../shared/api/queries';
import type { EventType } from '../shared/api/types';
import { formatDateTime } from '../shared/lib/dateTime';
import { EmptyState } from '../shared/ui/EmptyState';
import { ErrorState } from '../shared/ui/ErrorState';
import { LoadingState } from '../shared/ui/LoadingState';

type EventTypeFormState = {
  name: string;
  description: string;
  durationMinutes: number;
};

const initialCreateForm: EventTypeFormState = {
  name: '',
  description: '',
  durationMinutes: 30,
};

function toFormState(eventType: EventType): EventTypeFormState {
  return {
    name: eventType.name,
    description: eventType.description ?? '',
    durationMinutes: eventType.durationMinutes,
  };
}

function normalizeFormState(form: EventTypeFormState) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    durationMinutes: form.durationMinutes,
  };
}

function buildLocalEventType(
  form: EventTypeFormState,
  options?: {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  },
): EventType {
  const normalized = normalizeFormState(form);
  const now = new Date().toISOString();

  return {
    id: options?.id ?? `local-${crypto.randomUUID()}`,
    name: normalized.name,
    description: normalized.description,
    durationMinutes: normalized.durationMinutes,
    createdAt: options?.createdAt ?? now,
    updatedAt: options?.updatedAt ?? now,
  };
}

export function OwnerEventTypesPage() {
  const eventTypesQuery = useOwnerEventTypesQuery();
  const createMutation = useCreateOwnerEventTypeMutation();
  const updateMutation = useUpdateOwnerEventTypeMutation();
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EventTypeFormState>(initialCreateForm);
  const [createdEventTypes, setCreatedEventTypes] = useState<EventType[]>([]);
  const [updatedEventTypes, setUpdatedEventTypes] = useState<Record<string, EventType>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const eventTypes = eventTypesQuery.data?.items ?? [];
  const displayEventTypes = useMemo(() => {
    const updated = eventTypes.map((eventType) => updatedEventTypes[eventType.id] ?? eventType);
    const existingIds = new Set(updated.map((eventType) => eventType.id));
    const created = createdEventTypes.filter((eventType) => !existingIds.has(eventType.id));

    return [...created, ...updated];
  }, [createdEventTypes, eventTypes, updatedEventTypes]);

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);

    const submittedForm = {
      ...createForm,
    };

    createMutation.mutate(
      normalizeFormState(submittedForm),
      {
        onSuccess: (eventType) => {
          const nextEventType = buildLocalEventType(submittedForm, {
            id: eventType.id,
            createdAt: eventType.createdAt,
            updatedAt: eventType.updatedAt,
          });

          setCreatedEventTypes((items) => [
            nextEventType,
            ...items.filter((item) => item.id !== nextEventType.id),
          ]);
          setCreateForm(initialCreateForm);
          setSuccessMessage(`Тип встречи "${nextEventType.name}" отправлен на сохранение.`);
        },
      },
    );
  };

  const startEditing = (eventType: EventType) => {
    setSuccessMessage(null);
    setEditingId(eventType.id);
    setEditForm(toFormState(eventType));
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingId) {
      return;
    }

    setSuccessMessage(null);

    const submittedForm = {
      ...editForm,
    };

    updateMutation.mutate(
      {
        eventTypeId: editingId,
        body: normalizeFormState(submittedForm),
      },
      {
        onSuccess: (eventType) => {
          const currentEventType = displayEventTypes.find((item) => item.id === editingId);
          const nextEventType = buildLocalEventType(submittedForm, {
            id: editingId,
            createdAt: currentEventType?.createdAt ?? eventType.createdAt,
            updatedAt: eventType.updatedAt,
          });

          setUpdatedEventTypes((items) => ({
            ...items,
            [editingId]: nextEventType,
          }));
          setCreatedEventTypes((items) =>
            items.map((item) => (item.id === editingId ? nextEventType : item)),
          );
          setEditingId(null);
          setSuccessMessage(`Изменения для "${nextEventType.name}" отправлены на сохранение.`);
        },
      },
    );
  };

  return (
    <Stack gap="lg" className="owner-page">
      <section className="page-hero">
        <Badge color="callBlue" variant="light">
          Раздел владельца
        </Badge>
        <Title order={2}>Типы встреч</Title>
        <Text c="dimmed" maw={640}>
          Здесь владелец будет создавать и редактировать форматы встреч без авторизации.
        </Text>
      </section>

      {successMessage ? (
        <Alert color="callBlue" title="Готово" radius="sm">
          {successMessage}
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" className="owner-grid">
        <Card className="surface-card owner-form-card" padding="lg" radius="sm">
          <form onSubmit={handleCreate}>
            <Stack gap="md">
              <div>
                <Title order={3}>Создать тип встречи</Title>
                <Text c="dimmed" mt={4}>
                  Добавьте формат, который гости смогут выбрать на первом экране.
                </Text>
              </div>

              <TextInput
                label="Название"
                placeholder="Консультация"
                value={createForm.name}
                onChange={(event) => {
                  const value = event.currentTarget.value;

                  setCreateForm((form) => ({ ...form, name: value }));
                }}
                required
              />
              <Textarea
                label="Описание"
                placeholder="Короткий созвон для обсуждения вопроса"
                autosize
                minRows={3}
                value={createForm.description}
                onChange={(event) => {
                  const value = event.currentTarget.value;

                  setCreateForm((form) => ({ ...form, description: value }));
                }}
              />
              <NumberInput
                label="Длительность, минут"
                min={1}
                step={15}
                value={createForm.durationMinutes}
                onChange={(value) =>
                  setCreateForm((form) => ({
                    ...form,
                    durationMinutes: Number(value) || form.durationMinutes,
                  }))
                }
                required
              />

              {createMutation.isError ? (
                <Alert color="red" title="Не удалось создать тип встречи">
                  {getErrorMessage(createMutation.error)}
                </Alert>
              ) : null}

              <Button color="callBlue" loading={createMutation.isPending} type="submit">
                Создать тип встречи
              </Button>
            </Stack>
          </form>
        </Card>

        <Stack gap="md">
          {eventTypesQuery.isLoading ? (
            <LoadingState message="Загружаем типы встреч..." />
          ) : eventTypesQuery.isError ? (
            <ErrorState message={getErrorMessage(eventTypesQuery.error)} />
          ) : displayEventTypes.length === 0 ? (
            <EmptyState
              title="Типы встреч пока не созданы"
              message="Создайте первый формат встречи, чтобы он появился у гостя."
            />
          ) : (
            displayEventTypes.map((eventType) => {
              const isEditing = editingId === eventType.id;
              const isLocalCreated = createdEventTypes.some((item) => item.id === eventType.id);

              return (
                <Card
                  className="surface-card owner-event-card"
                  key={eventType.id}
                  padding="lg"
                  radius="sm"
                >
                  {isEditing ? (
                    <form onSubmit={handleUpdate}>
                      <Stack gap="md">
                        <TextInput
                          label="Название"
                          value={editForm.name}
                          onChange={(event) => {
                            const value = event.currentTarget.value;

                            setEditForm((form) => ({
                              ...form,
                              name: value,
                            }));
                          }}
                          required
                        />
                        <Textarea
                          label="Описание"
                          autosize
                          minRows={2}
                          value={editForm.description}
                          onChange={(event) => {
                            const value = event.currentTarget.value;

                            setEditForm((form) => ({
                              ...form,
                              description: value,
                            }));
                          }}
                        />
                        <NumberInput
                          label="Длительность, минут"
                          min={1}
                          step={15}
                          value={editForm.durationMinutes}
                          onChange={(value) =>
                            setEditForm((form) => ({
                              ...form,
                              durationMinutes: Number(value) || form.durationMinutes,
                            }))
                          }
                          required
                        />

                        {updateMutation.isError ? (
                          <Alert color="red" title="Не удалось сохранить изменения">
                            {getErrorMessage(updateMutation.error)}
                          </Alert>
                        ) : null}

                        <Group>
                          <Button color="callBlue" loading={updateMutation.isPending} type="submit">
                            Сохранить
                          </Button>
                          <Button
                            color="gray"
                            disabled={updateMutation.isPending}
                            onClick={() => setEditingId(null)}
                            type="button"
                            variant="subtle"
                          >
                            Отмена
                          </Button>
                        </Group>
                      </Stack>
                    </form>
                  ) : (
                    <Stack gap="md">
                      <Group justify="space-between" align="flex-start">
                        <Stack gap={4}>
                          <Title order={3}>{eventType.name}</Title>
                          <Text c="dimmed">
                            {eventType.description || 'Описание для этого типа встречи не добавлено.'}
                          </Text>
                        </Stack>
                        <Badge color="callBlue" variant="light">
                          {eventType.durationMinutes} мин
                        </Badge>
                      </Group>

                      <div className="owner-event-meta">
                        <Text size="xs" c="dimmed" fw={700}>
                          Обновлено
                        </Text>
                        <Text size="sm" fw={800}>
                          {formatDateTime(eventType.updatedAt)}
                        </Text>
                      </div>

                      {isLocalCreated ? (
                        <Badge color="callBlue" variant="outline" w="fit-content">
                          Новый
                        </Badge>
                      ) : null}

                      <Button
                        color="callBlue"
                        onClick={() => startEditing(eventType)}
                        variant="light"
                      >
                        Редактировать
                      </Button>
                    </Stack>
                  )}
                </Card>
              );
            })
          )}
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}
