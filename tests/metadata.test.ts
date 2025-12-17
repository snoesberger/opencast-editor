import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, baseURL }) => {
  await page.goto(baseURL);
  await page.click('button[role="menuitem"]:has-text("Metadata")');
});

test.describe('Test Metadata-Page', () => {

  // checks if fields contains their dummy-data
  test('Check Inputfields', async ({ page }) => {

    for (let i = 0; i < input.length; i++) {
      const locator = page.locator('input[name="' + input[i] + '"]');
      await expect(locator).toHaveValue(iValue[i]);
      await page.click('input[name="' + input[i] + '"]');
      await page.fill('input[name="' + input[i] + '"]', iFill[i]);
    }
    for (let i = 0; i < dropdown.length; i++) {
      const locator = page.locator('input[name="' + dropdown[i] + '"]');
      await expect(locator).toHaveValue(dValue[i]);
    }
  });

  test('Check other fields', async ({ page }) => {

    // different syntax and or not editable
    const description = page.locator('textarea[name="description"]');
    await expect(description).toHaveValue('');
    await page.click('textarea[name="description"]');
    await page.fill('textarea[name="description"]', 'Test-Description');

    const startDate = page.locator('input[name="startDate"]');
    await expect(startDate).toHaveValue(/[0-9]/);

    const created = page.locator('input[name="created"]');
    await expect(created).toHaveValue(/[0-9]/);

    const publisher = page.locator('input[name="publisher"]');
    await expect(publisher).toHaveValue('');

    const identifier = page.locator('input[name="identifier"]');
    await expect(identifier).toHaveValue('ID-dual-stream-demo');

  });

  test('Check: Change Dropdown Value', async ({ page, browserName }) => {

    // Language
    await page.click('[data-testid="language"] [class*="-control"]');
    await page.click('div[id*="option-22"]');

    // License
    await page.click('[data-testid="license"] [class*="-control"]');
    await page.click('div[id*="option-8"]');

    // Series / isPartOf
    await page.click('[data-testid="isPartOf"] [class*="-control"]');
    await page.click('div[id*="option-4"]');

    // Creator
    await page.click('[data-testid="creator"] [class*="-control"]');
    await page.click('div[id*="option-15"]');
    await page.click('[aria-label="Remove Lars Kiesow"]');

    // Contributor
    await page.click('[data-testid="contributor"] [class*="-control"]');
    await page.click('div[id*="option-15"]');
  });

});

const input = ['title', 'subject', 'rightsHolder', 'duration', 'location', 'source'];
const iValue = ['Dual-Stream Demo', '', '', '00:01:04', '', ''];
const iFill = ['Test-Title', 'Test-Subject', 'Test-Rights', '00:02:45', 'Test-Location', 'Test-Source'];

const dropdown = ['language', 'license', 'isPartOf', 'creator', 'contributor'];
const dValue = ['', 'CC-BY-SA', '', 'Lars Kiesow', ''];

