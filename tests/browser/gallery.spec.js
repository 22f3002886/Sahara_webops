import { test, expect } from '@playwright/test';
test('gallery pointer, keyboard, focus containment and restoration', async ({ page }) => {
  await page.goto('/');
  const first = page.locator('#gallery-enlarge');
  await first.click();
  await expect(page.locator('#lightbox')).toBeVisible();
  await expect(page.locator('#lightbox-close')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#lightbox-count')).toHaveText('2 / 3');
  await page.locator('#lightbox-next').click();
  await expect(page.locator('#lightbox-count')).toHaveText('3 / 3');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#lightbox-count')).toHaveText('1 / 3');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#lightbox-count')).toHaveText('3 / 3');
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() =>
        document.querySelector('#lightbox').contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).not.toBeVisible();
  await expect(first).toBeFocused();
  await first.press('Enter');
  await page.locator('#lightbox-close').click();
  await expect(first).toBeFocused();
});

test('gallery thumbnails and keyboard navigation update the preview without opening a modal', async ({
  page,
}) => {
  await page.goto('/');
  const thumbs = page.locator('.gallery-thumb');
  await expect(thumbs).toHaveCount(3);
  await thumbs.nth(1).click();
  await expect(page.locator('#gallery-photo-title')).toHaveText('Care in the community');
  await expect(page.locator('#lightbox')).not.toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(thumbs.nth(2)).toBeFocused();
  await expect(thumbs.nth(2)).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Home');
  await expect(thumbs.nth(0)).toBeFocused();
  await expect(page.locator('#gallery-position')).toHaveText('1 of 3');
  await page.locator('#gallery-previous').click();
  await expect(page.locator('#gallery-position')).toHaveText('3 of 3');
  await page.locator('#gallery-next').click();
  await expect(page.locator('#gallery-position')).toHaveText('1 of 3');
  await expect(page.locator('.album-links a')).toHaveCount(2);
});
