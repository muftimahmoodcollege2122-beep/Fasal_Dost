import { test, expect } from '@playwright/test';

test.describe('FasalDost Web App End-to-End', () => {
  test('loads home screen and navigates to marketplace', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3200); // Wait for 3-second splash screen

    // Expect app title to be visible
    const title = page.locator('text=FasalDost');
    await expect(title.first()).toBeVisible();

    // Navigate to Marketplace
    const marketplaceBtn = page.locator('text=Marketplace').first();
    await marketplaceBtn.click();

    // Verify marketplace feed header
    await expect(page.locator('text=Produce Exchange').or(page.locator('text=Marketplace')).first()).toBeVisible();
  });
});
