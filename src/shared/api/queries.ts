import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';
import type { CreateBookingForm, CreateEventTypeForm, ResourceId, UpdateEventTypeForm } from './types';

export const queryKeys = {
  eventTypes: ['eventTypes'] as const,
  eventType: (eventTypeId: ResourceId) => ['eventType', eventTypeId] as const,
  eventTypeSlots: (eventTypeId: ResourceId) => ['eventTypeSlots', eventTypeId] as const,
  ownerEventTypes: ['ownerEventTypes'] as const,
  ownerBookings: ['ownerBookings'] as const,
};

export function useEventTypesQuery() {
  return useQuery({
    queryKey: queryKeys.eventTypes,
    queryFn: api.listEventTypes,
  });
}

export function useEventTypeQuery(eventTypeId?: ResourceId) {
  return useQuery({
    queryKey: eventTypeId ? queryKeys.eventType(eventTypeId) : ['eventType', 'missing'],
    queryFn: () => api.getEventType(eventTypeId as ResourceId),
    enabled: Boolean(eventTypeId),
  });
}

export function useEventTypeSlotsQuery(eventTypeId?: ResourceId) {
  return useQuery({
    queryKey: eventTypeId ? queryKeys.eventTypeSlots(eventTypeId) : ['eventTypeSlots', 'missing'],
    queryFn: () => api.listEventTypeSlots(eventTypeId as ResourceId),
    enabled: Boolean(eventTypeId),
  });
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateBookingForm) => api.createBooking(body),
    onSuccess: (_booking, body) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.eventTypeSlots(body.eventTypeId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.ownerBookings });
    },
  });
}

export function useOwnerEventTypesQuery() {
  return useQuery({
    queryKey: queryKeys.ownerEventTypes,
    queryFn: api.listOwnerEventTypes,
  });
}

export function useCreateOwnerEventTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateEventTypeForm) => api.createOwnerEventType(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ownerEventTypes });
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventTypes });
    },
  });
}

export function useUpdateOwnerEventTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventTypeId, body }: { eventTypeId: ResourceId; body: UpdateEventTypeForm }) =>
      api.updateOwnerEventType(eventTypeId, body),
    onSuccess: (eventType) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ownerEventTypes });
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventTypes });
      void queryClient.invalidateQueries({ queryKey: queryKeys.eventType(eventType.id) });
    },
  });
}

export function useOwnerBookingsQuery() {
  return useQuery({
    queryKey: queryKeys.ownerBookings,
    queryFn: api.listOwnerBookings,
  });
}
