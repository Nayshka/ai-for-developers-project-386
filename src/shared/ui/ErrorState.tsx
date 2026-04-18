import { Alert } from '@mantine/core';

type ErrorStateProps = {
  title?: string;
  message?: string;
};

export function ErrorState({
  title = 'Не удалось загрузить данные',
  message = 'Попробуйте обновить страницу или повторить действие позже.',
}: ErrorStateProps) {
  return (
    <Alert color="red" radius="sm" title={title}>
      {message}
    </Alert>
  );
}
