import {test,expect} from '@playwright/test';
test('gallery pointer, keyboard, focus containment and restoration',async({page})=>{
 await page.goto('/');const first=page.locator('.gallery-open').first();await first.click();
 await expect(page.locator('#lightbox')).toBeVisible();await expect(page.locator('#lightbox-close')).toBeFocused();
 await page.keyboard.press('ArrowRight');await expect(page.locator('#lightbox-count')).toHaveText('2 / 3');
 await page.locator('#lightbox-next').click();await expect(page.locator('#lightbox-count')).toHaveText('3 / 3');
 await page.keyboard.press('ArrowRight');await expect(page.locator('#lightbox-count')).toHaveText('1 / 3');
 await page.keyboard.press('ArrowLeft');await expect(page.locator('#lightbox-count')).toHaveText('3 / 3');
 for(let i=0;i<5;i++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.querySelector('#lightbox').contains(document.activeElement))).toBe(true);}
 await page.keyboard.press('Escape');await expect(page.locator('#lightbox')).not.toBeVisible();await expect(first).toBeFocused();
 await first.press('Enter');await page.locator('#lightbox-close').click();await expect(first).toBeFocused();
});
