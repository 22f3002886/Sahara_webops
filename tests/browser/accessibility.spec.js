import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const width of [375, 768, 1440])
  test(`accessible layout and navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(axe.violations).toEqual([]);
    for (const a of await page.locator('a[href^="#"]').all()) {
      const href = await a.getAttribute('href');
      expect(await page.locator(href).count()).toBe(1);
    }
    if (width <= 800) {
      await page.locator('#menu-toggle').click();
      await page.locator('#navigation a[href="#about"]').click();
      await expect(page.locator('#menu-toggle')).toHaveAttribute('aria-expanded', 'false');
    } else await page.locator('#navigation a[href="#about"]').click();
    await expect(page).toHaveURL(/#about$/);
    await page.waitForTimeout(600);
    expect(
      await page.locator('#about').evaluate((e) => e.getBoundingClientRect().top),
    ).toBeGreaterThanOrEqual(79);
    const socials = page.locator('.socials a');
    await expect(socials).toHaveCount(3);
    expect(await socials.evaluateAll((links) => links.map((a) => a.href))).toEqual([
      'https://www.instagram.com/sahara_iitmbs/',
      'https://www.linkedin.com/company/sahara-the-social-welfare-society/',
      'https://www.youtube.com/@saharaiitm',
    ]);
    expect(errors).toEqual([]);
  });
test('lightbox accessibility and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe(
    'auto',
  );
  await page.locator('.gallery-open').first().click();
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations).toEqual([]);
});

test('active contact navigation keeps readable contrast', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#contact');
  await expect(page.locator('#navigation .nav-contact')).toHaveAttribute(
    'aria-current',
    'location',
  );
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});
