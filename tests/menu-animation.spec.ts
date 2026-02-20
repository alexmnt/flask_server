import { test, expect } from '@playwright/test';

test.describe('menu drawer animation', () => {
  test.use({ viewport: { width: 1280, height: 720 }, reducedMotion: 'no-preference' });

  test('menu panel uses slide transition styles', async ({ page }) => {
    await page.goto('/');

    const menuShell = page.locator('.menu-shell');
    const menuPanel = page.locator('[data-menu-panel]');

    await expect(menuShell).toHaveCSS('position', 'fixed');
    await expect(menuPanel).toHaveCSS('position', 'relative');

    const transitionProperty = await menuPanel.evaluate((el) => {
      return getComputedStyle(el).transitionProperty;
    });
    expect(transitionProperty).toContain('max-height');
    expect(transitionProperty).toContain('opacity');
    expect(transitionProperty).toContain('transform');

    const transitionDuration = await menuPanel.evaluate((el) => {
      return getComputedStyle(el).transitionDuration;
    });
    const durations = transitionDuration
      .split(',')
      .map((value) => Number.parseFloat(value))
      .filter((value) => Number.isFinite(value));
    expect(Math.max(...durations)).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Hide menu' }).click();

    await expect(menuPanel).toHaveCSS('opacity', '0');
    await expect(menuPanel).toHaveCSS('max-height', '0px');

    await page.getByRole('button', { name: 'Show menu' }).click();

    await expect(menuPanel).toHaveCSS('opacity', '1');
  });

  test('menu overlay does not shift main content', async ({ page }) => {
    await page.goto('/');

    const menuPanel = page.locator('[data-menu-panel]');
    const mainContent = page.locator('.main-content');

    const initialTop = await mainContent.evaluate((el) => {
      return Math.round(el.getBoundingClientRect().top);
    });

    await page.getByRole('button', { name: 'Hide menu' }).click();
    await expect(menuPanel).toHaveCSS('opacity', '0');

    const closedTop = await mainContent.evaluate((el) => {
      return Math.round(el.getBoundingClientRect().top);
    });

    expect(Math.abs(initialTop - closedTop)).toBeLessThanOrEqual(1);

    await page.getByRole('button', { name: 'Show menu' }).click();
    await expect(menuPanel).toHaveCSS('opacity', '1');

    const reopenedTop = await mainContent.evaluate((el) => {
      return Math.round(el.getBoundingClientRect().top);
    });

    expect(Math.abs(initialTop - reopenedTop)).toBeLessThanOrEqual(1);
  });
});
