function toDate(value: string | Date) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value: string | Date) {
  const date = toDate(value);

  if (!date) {
    return String(value);
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatDate(value: string | Date) {
  const date = toDate(value);

  if (!date) {
    return 'Дата не указана';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export function formatTime(value: string | Date) {
  const date = toDate(value);

  if (!date) {
    return String(value);
  }

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTimeRange(startAt: string | Date, endAt: string | Date) {
  return `${formatTime(startAt)}-${formatTime(endAt)}`;
}
