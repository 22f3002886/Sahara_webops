import {test,expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
async function fill(page){await page.getByLabel('Your name',{exact:true}).fill('Synthetic Browser Tester');await page.getByLabel('Email address',{exact:true}).fill('browser-test@example.com');await page.getByLabel('I’d like to talk about').selectOption('Volunteering');await page.getByLabel('Your message',{exact:true}).fill('Synthetic browser inquiry to verify persistent retrieval.');}
test('empty and malformed inputs show accessible errors',async({page})=>{await page.goto('/');await page.locator('#submit-button').click();await expect(page.locator('#name')).toBeFocused();await expect(page.locator('#name')).toHaveAttribute('aria-invalid','true');await fill(page);await page.locator('#email').fill('bad');await page.locator('#submit-button').click();await expect(page.locator('#email-error')).toHaveText('Enter a valid email address.');});
test('network failure preserves message and never shows success',async({page})=>{await page.goto('/');await fill(page);await page.route('**/api/contact',route=>route.abort());await page.locator('#submit-button').click();await expect(page.locator('#form-status')).toHaveAttribute('data-state','error');await expect(page.locator('#message')).toHaveValue('Synthetic browser inquiry to verify persistent retrieval.');await expect(page.locator('#submit-button')).toBeEnabled();});
test('browser saves once, disables duplicate clicks, clears only after acceptance, CLI retrieves',async({page})=>{
 await page.goto('/');await fill(page);await page.waitForTimeout(1700);let count=0;
 await page.route('**/api/contact',async route=>{count++;await new Promise(resolve=>setTimeout(resolve,350));await route.continue();});
 await page.locator('#submit-button').click();await expect(page.locator('#submit-button')).toBeDisabled();await page.locator('#contact-form').evaluate(f=>{f.dispatchEvent(new Event('submit',{cancelable:true}));});
 await expect(page.locator('#form-status')).toHaveAttribute('data-state','success');expect(count).toBe(1);await expect(page.locator('#message')).toHaveValue('');
 const saved=JSON.parse(execFileSync(process.execPath,['scripts/inquiries.js','50'],{encoding:'utf8'}));expect(saved.some(x=>x.email==='browser-test@example.com'&&x.message==='Synthetic browser inquiry to verify persistent retrieval.')).toBe(true);
});
