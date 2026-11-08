import { test, expect } from '@playwright/test';
test('all reference events, goals, team profiles and membership destinations are present', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.event-card')).toHaveCount(6);
  await expect(page.locator('.goal-list li')).toHaveCount(4);
  await expect(page.locator('.ways-list li')).toHaveCount(4);
  await expect(page.locator('.person')).toHaveCount(12);
  await expect(page.locator('#event-rakshak')).toContainText('Sidram Solankar');
  await expect(page.locator('#event-posters')).toContainText('Diplomacia');
  await expect(page.locator('#event-orientation')).toContainText('24 July 2023');
  for (const a of await page.locator('a[href*="forms.gle"]').all())
    expect(await a.getAttribute('href')).toBe('https://forms.gle/h4X3TSpWirGVixGW6');
  await expect(page.locator('.join-panel a')).toHaveAttribute(
    'href',
    'https://forms.gle/h4X3TSpWirGVixGW6',
  );
  expect(await page.locator('.event-card a[href*="sahara-society.github.io"]').count()).toBe(0);
  await page.getByRole('button', { name: 'Creative activities', exact: true }).click();
  await expect(page.locator('.event-card:visible')).toHaveCount(1);
  await expect(page.locator('#event-posters')).toBeVisible();
  await page.locator('#event-posters summary').click();
  await expect(page.locator('#event-posters details')).toHaveAttribute('open', '');
  await page.getByRole('button', { name: 'All events 6', exact: true }).click();
  await expect(page.locator('.event-card:visible')).toHaveCount(6);
  await page.locator('#activity-udaipur .reflections summary').click();
  await expect(page.locator('#activity-udaipur .reflections li')).toHaveCount(6);
});
test('footer collaboration flow prefills context without submitting', async ({ page }) => {
  await page.goto('/');
  let posts = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/contact') && request.method() === 'POST') posts++;
  });
  await page.getByLabel('Your collaboration email').fill('synthetic-collab@example.com');
  await page.getByRole('button', { name: 'Start a conversation', exact: true }).click();
  await expect(page.locator('#email')).toHaveValue('synthetic-collab@example.com');
  await expect(page.locator('#topic')).toHaveValue('Collaboration');
  await expect(page.locator('#name')).toBeFocused();
  expect(posts).toBe(0);
  await expect(page.locator('#identity option')).toHaveCount(7);
  await expect(page.locator('#topic option')).toHaveCount(9);
});
