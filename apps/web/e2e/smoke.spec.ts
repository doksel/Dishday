import { expect, test } from '@playwright/test';

test.describe('Dishday web — smoke', () => {
  test('landing page renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: /Dishday/i })).toBeVisible();
  });

  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('signup page links to login', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });
});
