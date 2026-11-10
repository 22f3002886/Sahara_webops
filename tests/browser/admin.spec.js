import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [375, 820, 1440])
  test(`admin inbox is accessible and responsive at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/admin');
    await expect(page.locator('#login-panel')).toBeVisible();
    await page.locator('.brand img').evaluate((image) => image.decode());
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({ path: `artifacts/admin-login-${width}.png`, fullPage: true });
    if (width === 375) {
      await page.locator('#username').fill('admin');
      await page.locator('#password').fill('wrong');
      await page.locator('#login-button').click();
      await expect(page.locator('#login-error')).toContainText('Incorrect');
    }
    await page.locator('#username').fill('admin');
    await page.locator('#password').fill('synthetic-browser-password-only');
    await page.locator('#login-button').click();
    await expect(page.locator('#inbox')).toBeVisible();
    await expect(page.locator('#submissions')).toHaveAttribute('aria-busy', 'false');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({ path: `artifacts/admin-inbox-${width}.png`, fullPage: true });
    await page.locator('#search').fill('no-such-synthetic-inquiry');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.locator('#submissions')).toContainText('No submissions match');
    await page.locator('#logout').click();
    await expect(page.locator('#login-panel')).toBeVisible();
    expect((await page.request.get('/api/admin/inquiries')).status()).toBe(401);
  });

test('visitor submission appears in authenticated inbox, message is safe text, session persists on reload', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#name').fill('Synthetic Admin Browser Tester');
  await page.locator('#email').fill('admin-browser@example.com');
  await page.locator('#topic').selectOption('Collaboration');
  const message = '<img src=x onerror=alert(1)> Synthetic admin inbox verification.';
  await page.locator('#message').fill(message);
  await page.waitForTimeout(1700);
  await page.locator('#submit-button').click();
  await expect(page.locator('#form-status')).toHaveAttribute('data-state', 'success');
  await page.goto('/admin');
  await page.locator('#username').fill('admin');
  await page.locator('#password').fill('synthetic-browser-password-only');
  await page.locator('#login-button').click();
  await expect(page.locator('#inbox')).toBeVisible();
  await page.locator('#search').fill('admin-browser@example.com');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  const button = page.getByRole('button', {
    name: 'Read message from Synthetic Admin Browser Tester',
  });
  await button.click();
  await expect(page.locator('#message-dialog')).toBeVisible();
  await expect(page.locator('#message-body')).toHaveText(message);
  await expect(page.locator('#message-body img')).toHaveCount(0);
  await expect(page.locator('#message-meta')).toContainText('admin-browser@example.com');
  await page.setViewportSize({ width: 375, height: 900 });
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({ path: 'artifacts/admin-message-mobile.png', fullPage: true });
  await page.keyboard.press('Escape');
  await expect(button).toBeFocused();
  await page.reload();
  await expect(page.locator('#inbox')).toBeVisible();
  await page.locator('#logout').click();
  await expect(page.locator('#login-panel')).toBeVisible();
});
