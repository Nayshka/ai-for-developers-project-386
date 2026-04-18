import { Center, Loader, Stack, Text } from '@mantine/core';

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = 'Загружаем данные...' }: LoadingStateProps) {
  return (
    <Center py="xl">
      <Stack align="center" gap="sm">
        <Loader color="callBlue" />
        <Text c="dimmed">{message}</Text>
      </Stack>
    </Center>
  );
}
