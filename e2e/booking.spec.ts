import { expect, test } from '@playwright/test';

test('guest can book a consultation and owner sees it', async ({ page }) => {
  await page.goto('/');

  const consultationCard = page.locator('.event-type-card').filter({
    has: page.getByRole('heading', { name: 'Консультация' }),
  });
  await consultationCard.getByRole('link', { name: 'Выбрать время' }).click();

  await expect(page.getByRole('heading', { name: 'Свободные слоты' })).toBeVisible();
  await page.locator('.slot-button').first().click();
  await page.getByLabel('Имя').fill('Анна Playwright');
  await page.getByLabel('Email').fill('anna.playwright@example.com');
  await page.getByRole('button', { name: 'Забронировать' }).click();

  await expect(page.getByText('Встреча успешно забронирована')).toBeVisible();
  await expect(page.getByText('Анна Playwright')).toBeVisible();
  await expect(page.getByText('anna.playwright@example.com')).toBeVisible();

  await page.goto('/owner/bookings');

  await expect(page.getByRole('heading', { name: 'Бронирования' })).toBeVisible();
  await expect(page.getByText('Анна Playwright').first()).toBeVisible();
  await expect(page.getByText('anna.playwright@example.com').first()).toBeVisible();
  await expect(page.getByText('Консультация').first()).toBeVisible();
  await expect(page.getByText('Подтверждено').first()).toBeVisible();
});

test('owner can create event type and guest can select it', async ({ page }) => {
  const eventTypeName = `Разбор проекта ${Date.now()}`;

  await page.goto('/owner/event-types');

  await page.getByLabel('Название').first().fill(eventTypeName);
  await page
    .getByLabel('Описание')
    .first()
    .fill('Сессия для обсуждения архитектуры и следующих шагов.');
  await page.getByLabel('Длительность, минут').first().fill('45');
  await page.getByRole('button', { name: 'Создать тип встречи' }).click();

  await expect(page.getByText(`Тип встречи "${eventTypeName}" отправлен на сохранение.`)).toBeVisible();
  await expect(page.getByRole('heading', { name: eventTypeName })).toBeVisible();

  await page.goto('/');

  const createdCard = page.locator('.event-type-card').filter({
    has: page.getByRole('heading', { name: eventTypeName }),
  });
  await expect(createdCard).toBeVisible();
  await createdCard.getByRole('link', { name: 'Выбрать время' }).click();

  await expect(page.getByRole('heading', { name: eventTypeName })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Свободные слоты' })).toBeVisible();
});
