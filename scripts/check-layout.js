import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {});
await mkdir('artifacts',{recursive:true});
for(const width of [375,768,1440]) {
 const page=await browser.newPage({viewport:{width,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3000');await page.evaluate(()=>document.fonts.ready);
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error(`Overflow at ${width}`);
 if(width<=800){await page.locator('#menu-toggle').click();if(await page.locator('#menu-toggle').getAttribute('aria-expanded')!=='true')throw Error('Menu failed');await page.keyboard.press('Escape');}
 if(errors.length)throw Error(errors.join('\n'));
 for(const image of await page.locator('img[loading=lazy]').all()) { await image.scrollIntoViewIfNeeded(); await image.evaluate(img=>img.decode()); }
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(850);
 await page.screenshot({path:`artifacts/layout-${width}.png`,fullPage:true});console.log(`Layout ${width}px: no overflow or script errors; menu verified`);await page.close();
}
await browser.close();
