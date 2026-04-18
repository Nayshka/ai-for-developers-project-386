import { Paper, Stack, Text, Title } from '@mantine/core';

type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <Paper className="empty-state" p="xl" radius="sm">
      <Stack gap="xs">
        <Title order={2}>{title}</Title>
        <Text c="dimmed">{message}</Text>
      </Stack>
    </Paper>
  );
}
