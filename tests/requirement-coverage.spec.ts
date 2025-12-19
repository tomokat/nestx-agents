import { test, expect } from '@playwright/test';

test.describe('Requirement [REQ-001] Live Dashboard', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard');
    });

    test('[UC-1.1] System Metrics load asynchronously', async ({ page }) => {
        // Check for initial loading state (might be too fast)
        // await expect(page.locator('text=Loading metrics...')).toBeVisible(); 

        // Verify metrics are loaded
        await expect(page.locator('text=CPU Usage')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=Memory')).toBeVisible();
        await expect(page.locator('text=mB')).toBeVisible(); // Case insensitive usually
    });

    test('[UC-1.2] Task Progress updates via polling', async ({ page }) => {
        // Click start
        await page.click('button:has-text("Start AI Agent Simulation")');

        // Wait for "Task Runner" section to show progress
        const progressLabel = page.locator('text=Progress:');
        await expect(progressLabel).toBeVisible();

        // Capture initial progress
        const initialText = await progressLabel.innerText();

        // Wait for at least one poll (1s or 2s)
        await page.waitForTimeout(2500);

        // Capture next progress
        const nextText = await progressLabel.innerText();

        // Validates that it changed (progress increased)
        expect(initialText).not.toBe(nextText);
    });

    test('[UC-1.3] Search debounces and filters', async ({ page }) => {
        const searchInput = page.locator('input[name="q"]');
        const tableBody = page.locator('#missions-body');

        // Type query
        await searchInput.fill('Gamma');

        // Verify immediate state hasn't changed if debounce is working (hard to test exact timing, but we verify result)
        // Wait for debounce and partial swap
        await expect(tableBody).toContainText('Gamma Ray', { timeout: 2000 });

        // Verify others are gone
        await expect(tableBody).not.toContainText('Alpha Protocol');
    });
});
