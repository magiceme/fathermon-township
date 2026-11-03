const { test, expect } = require('playwright/test');
test('startup has no JavaScript errors', async ({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#intro')).toBeVisible();
  await page.evaluate(()=>{selected=0;startGame(false);hideModal()});
  await page.waitForTimeout(500);
  expect(await page.evaluate(()=>state.residents.length)).toBe(0);
  expect(errors).toEqual([]);
});
