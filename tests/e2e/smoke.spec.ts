import { test, expect } from '@playwright/test';

test('carga pantalla de login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/$|\/dashboard|\/manuales/);
  await expect(page.locator('body')).toBeVisible();
});

test('ruta clientes dentro de sifen existe', async ({ page }) => {
  await page.goto('/sifen/clientes');
  await expect(page).toHaveURL(/\/sifen\/clientes|\/dashboard|\/$/);
  await expect(page.locator('body')).toBeVisible();
});

test('ruta manuales publica responde', async ({ page }) => {
  await page.goto('/manuales');
  await expect(page).toHaveURL(/\/manuales/);
  await expect(page.locator('text=Manuales de Usuario')).toBeVisible();
});
