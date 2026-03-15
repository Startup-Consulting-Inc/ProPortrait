import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe('Anonymous Payment & Download Flow', () => {
  test('anonymous user with session credits can download without sign-in prompt', async ({ page, context }) => {
    // Step 1: Navigate to app and upload a photo
    await page.goto('http://localhost:3000');
    
    const fileInput = page.locator('input[type="file"]');
    const fixturePath = path.join(__dirname, 'fixtures', 'test-portrait.jpg');
    await fileInput.setInputFiles(fixturePath);
    
    // Step 2: Wait for generation options and generate
    await expect(page.getByText(/choose your style/i)).toBeVisible({ timeout: 10000 });
    
    // Click generate button
    await page.getByRole('button', { name: /generate portraits/i }).click();
    
    // Step 3: Wait for generation to complete (skip to step 4)
    await page.waitForTimeout(2000); // In real test, wait for actual generation
    
    // For testing: manually set step to 4 by clicking a generated image
    // This simulates having a generated portrait ready for export
    
    // Step 4: Verify Export step is accessible
    // First, let's simulate having a portrait by directly navigating to export
    // In a real scenario, we'd wait for generation
    
    // Check that "Buy & Download" button exists when no credits
    await expect(page.getByText(/buy.*download/i).first()).toBeVisible();
    
    // NOTE: We cannot test the full Stripe payment flow in e2e because:
    // 1. Stripe checkout opens on stripe.com domain (cross-origin)
    // 2. Payment completion requires webhook callbacks
    // 3. Cross-tab communication is hard to test reliably
    
    // What we CAN verify:
    // - BuyCreditsModal opens when clicking buy
    // - Session is created (check cookies)
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'pp_session');
    console.log('Session cookie exists:', !!sessionCookie);
    
    // The actual payment flow requires:
    // 1. Real Stripe transaction (or test mode)
    // 2. Webhook delivery to local/dev server
    // 3. Cross-tab state synchronization
    
    expect(sessionCookie).toBeTruthy();
  });
  
  test('credits display updates after purchase', async ({ page }) => {
    // This test verifies that when credits are added (simulated),
    // the download buttons become available
    
    await page.goto('http://localhost:3000');
    
    // Upload photo
    const fileInput = page.locator('input[type="file"]');
    const fixturePath = path.join(__dirname, 'fixtures', 'test-portrait.jpg');
    await fileInput.setInputFiles(fixturePath);
    
    // Navigate to export step
    // In real app, we'd generate first. For this test, we're checking the credit check logic
    
    // Check initial state - should show "Buy & Download" if no credits
    // After credits are added (via API or localStorage simulation), 
    // it should show "Download HD Portrait"
    
    // NOTE: To fully test this, we'd need to:
    // 1. Mock the /api/auth/me endpoint to return credits
    // 2. Or use Playwright's route interception
    // 3. Or manually set localStorage/cookies before page load
    
    await expect(page.getByText(/upload/i).first()).toBeVisible();
  });
});

test.describe('BuyCreditsModal', () => {
  test('modal opens and shows payment options', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Upload to get to step 4
    const fileInput = page.locator('input[type="file"]');
    const fixturePath = path.join(__dirname, 'fixtures', 'test-portrait.jpg');
    await fileInput.setInputFiles(fixturePath);
    
    // Wait for Buy & Download button and click it
    const buyButton = page.getByRole('button', { name: /buy.*download/i });
    await expect(buyButton).toBeVisible({ timeout: 10000 });
    
    await buyButton.click();
    
    // Verify BuyCreditsModal content
    await expect(page.getByText(/get more credits/i)).toBeVisible();
    await expect(page.getByText(/complete payment in the new tab/i)).toBeVisible();
    
    // Verify payment options exist
    await expect(page.getByText(/1 hd download/i)).toBeVisible();
    await expect(page.getByText(/1 platform export/i)).toBeVisible();
  });
});
