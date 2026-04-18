import { Box, Container, Group, Text, Title } from '@mantine/core';
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { label: 'Гость', to: '/' },
  { label: 'Типы встреч', to: '/owner/event-types' },
  { label: 'Бронирования', to: '/owner/bookings' },
];

export function AppLayout() {
  return (
    <Box className="app-shell">
      <header className="app-header">
        <Container size="lg">
          <Group justify="space-between" gap="lg" wrap="wrap">
            <Box>
              <Title order={1} className="app-logo">
                Запись на звонок
              </Title>
              <Text size="sm" c="dimmed">
                MVP сервиса бронирования времени
              </Text>
            </Box>

            <nav className="app-nav" aria-label="Основная навигация">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </Group>
        </Container>
      </header>

      <main>
        <Container size="lg" py="xl">
          <Outlet />
        </Container>
      </main>
    </Box>
  );
}
