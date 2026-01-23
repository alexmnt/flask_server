import { test, expect } from '@playwright/test';

test.describe('menu drawer', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('shows the navigation grid with menu items', async ({ page }) => {
    await page.goto('/');

    const menuGrid = page.getByRole('region', { name: 'PHI navigation' });

    await expect(menuGrid).toBeVisible();
    await expect(menuGrid.getByRole('listitem')).toHaveCount(14);
  });

  test('toggles closed and reopens from the fab', async ({ page }) => {
    await page.goto('/');

    const menuDrawer = page.locator('[data-menu-drawer]');
    const menuPanel = page.locator('[data-menu-panel]');
    const menuToggle = page.getByRole('button', { name: 'Hide menu' });
    const menuReopen = page.locator('[data-menu-reopen]');

    await expect(menuDrawer).toHaveAttribute('data-state', 'open');
    await expect(menuPanel).toHaveAttribute('aria-hidden', 'false');

    await menuToggle.click();

    await expect(menuDrawer).toHaveAttribute('data-state', 'closed');
    await expect(menuPanel).toHaveAttribute('aria-hidden', 'true');
    await expect(menuReopen).toHaveAttribute('aria-hidden', 'false');
    await expect(menuReopen).toBeVisible();

    await menuReopen.click();

    await expect(menuDrawer).toHaveAttribute('data-state', 'open');
    await expect(menuPanel).toHaveAttribute('aria-hidden', 'false');
  });
});
