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
  await expect(page.locator('.footer-membership > .button')).toHaveAttribute(
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
test('reading order matches navigation and desktop footer stays in one row', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const expected = ['home', 'about', 'activities', 'work', 'gallery', 'team', 'contact'];
  expect(
    await page.locator('#navigation a').evaluateAll((links) => links.map((a) => a.hash.slice(1))),
  ).toEqual(expected);
  expect(
    await page
      .locator('.hero-stage > section, main > section')
      .evaluateAll((sections) => sections.map((s) => s.id)),
  ).toEqual(expected);
  for (const id of expected) {
    await page.locator(`#navigation a[href="#${id}"]`).click();
    await expect(page.locator(`#navigation a[href="#${id}"]`)).toHaveAttribute(
      'aria-current',
      'location',
    );
  }
  const tops = await page
    .locator('.footer-row > *')
    .evaluateAll((columns) => columns.map((c) => Math.round(c.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);
  await expect(
    page.locator(
      '.footer-wordmark, .footer-resources, .footer-bottom, .current-team, .archive-label',
    ),
  ).toHaveCount(0);
  await expect(page.locator('#team')).not.toContainText('Aditya');
  await expect(page.locator('#team .person-bio')).toHaveCount(10);
  await expect(page.locator('#about a[href*="forms.gle"]')).toHaveCount(1);
  await expect(page.locator('#activities a[href*="animalaidunlimited.org/donation"]')).toHaveCount(
    1,
  );
  await expect(page.locator('#activities .reflections')).toHaveCount(2);
  await expect(page.locator('main > #gallery')).toHaveCount(1);
  await expect(page.locator('.contact-email')).toHaveText('Email');
  await expect(page.locator('.footer-email')).toHaveText('Email');
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
