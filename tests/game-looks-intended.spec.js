// @ts-check
// Playwright tests to ensure the Cupid game looks and behaves as intended.
// Prereq: serve the app (e.g. npx serve -p 3000 .) then: npx playwright test

const { test, expect } = require('@playwright/test');

test.describe('Cupid game layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Dismiss age gate if present so we see the full game
    const ageGate = page.getByRole('dialog', { name: 'Age Gate' });
    if (await ageGate.isVisible()) {
      await page.getByRole('button', { name: 'I am 18+' }).click();
      await expect(ageGate).not.toBeVisible();
    }
    await page.waitForTimeout(500);
  });

  test('main app region and title are present', async ({ page }) => {
    await expect(page.getByRole('main', { name: /Cupid HUD Prototype v3/i })).toBeVisible();
    await expect(page).toHaveTitle(/Cupid Sandbox/);
  });

  test('scene background layer has an image with alt', async ({ page }) => {
    const sceneLayer = page.getByRole('region', { name: 'Scene background' });
    await expect(sceneLayer).toBeVisible();
    const img = sceneLayer.locator('img').first();
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('alt', /./);
  });

  test('mid layer and hotspots container exist', async ({ page }) => {
    await expect(page.getByRole('region', { name: 'Mid layer' })).toBeVisible();
    await expect(page.locator('#hotspots')).toBeVisible();
  });

  test('all HUD buttons are present and visible', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'HUD buttons' });
    await expect(nav).toBeVisible();
    const labels = ['Stats', 'Log', 'Map', 'Inv', 'Missions', 'Edit', 'Settings'];
    for (const label of labels) {
      await expect(nav.getByRole('button', { name: new RegExp(label, 'i') })).toBeVisible();
    }
  });

  test('initial scene (Afterparty Apartment) shows Phone hotspot', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Phone' })).toBeVisible();
  });

  test('no placeholder instruction text is visible on screen', async ({ page }) => {
    await expect(page.getByText('Replace this SVG with your generated scene image')).not.toBeVisible();
  });

  test('clicking Phone hotspot opens choice modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Phone' }).click({ force: true });
    await expect(page.getByText(/Flip it over|Leave it/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText(/Flip it over|Leave it/)).not.toBeVisible();
  });
});

test.describe('Age gate flow', () => {
  test('age gate shows when not yet passed, then closes on I am 18+', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('cupid_proto_v3_editor'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('dialog', { name: 'Age Gate' })).toBeVisible();
    await expect(page.getByText(/18 or older/)).toBeVisible();
    await page.getByRole('button', { name: 'I am 18+' }).click();
    await expect(page.getByRole('dialog', { name: 'Age Gate' })).not.toBeVisible();
  });
});
