import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe('Portrait Generator flow', () => {
  test('Step 1 loads with upload area', async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Step 1 upload area should be present
    await expect(page.getByText(/upload/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('uploading a photo advances to Step 2', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const fileInput = page.locator('input[type="file"]');
    const fixturePath = path.join(__dirname, 'fixtures', 'test-portrait.jpg');
    await fileInput.setInputFiles(fixturePath);

    // Step 2 should show the style grid
    await expect(page.getByText(/choose your style/i)).toBeVisible({ timeout: 10000 });
  });
});
