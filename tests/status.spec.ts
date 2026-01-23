import { test, expect } from '@playwright/test';

test.describe('status page', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('health check updates status', async ({ page }) => {
    await page.goto('/status');

    const statusPill = page.locator('[data-status="pill"]');
    const statusText = page.locator('[data-status="text"]');
    const statusTime = page.locator('[data-status="time"]');
    const statusLatency = page.locator('[data-status="latency"]');

    await page.getByRole('button', { name: 'Primary action' }).click();

    await expect(statusText).toHaveText(/Server healthy and responding\./);
    await expect(statusPill).toHaveText('Online');
    await expect(statusPill).toHaveClass(/ok/);
    await expect(statusTime).not.toHaveText('--');
    await expect(statusLatency).toHaveText(/\d+ ms/);
  });

  test('echo form returns message payload', async ({ page }) => {
    await page.goto('/status');

    const message = 'Hello Playwright';
    const input = page.getByRole('textbox', { name: 'Message' });
    const result = page.locator('[data-echo="result"]');

    await input.fill(message);
    await page.getByRole('button', { name: 'Action A' }).click();

    await expect(result).toHaveText(new RegExp(`Received: "${message}" \\(\\d+ chars\\)`));
  });
});
