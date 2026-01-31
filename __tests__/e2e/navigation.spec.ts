import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('sidebar is visible on home page', async ({ page }) => {
    await page.goto('/');
    
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });

  test('sidebar has logo', async ({ page }) => {
    await page.goto('/');
    
    const logo = page.locator('aside').locator('text=M');
    await expect(logo).toBeVisible();
  });

  test('sidebar has Learn link', async ({ page }) => {
    await page.goto('/');
    
    const learnLink = page.getByRole('link', { name: /learn/i });
    await expect(learnLink).toBeVisible();
  });

  test('sidebar has Upload link', async ({ page }) => {
    await page.goto('/');
    
    const uploadLink = page.getByRole('link', { name: /upload/i });
    await expect(uploadLink).toBeVisible();
  });

  test('sidebar has History link', async ({ page }) => {
    await page.goto('/');
    
    const historyLink = page.getByRole('link', { name: /history/i });
    await expect(historyLink).toBeVisible();
  });

  test('Learn link navigates to home page', async ({ page }) => {
    await page.goto('/upload');
    
    const learnLink = page.getByRole('link', { name: /learn/i });
    await learnLink.click();
    
    await expect(page).toHaveURL('/');
  });

  test('Upload link navigates to upload page', async ({ page }) => {
    await page.goto('/');
    
    const uploadLink = page.getByRole('link', { name: /upload/i });
    await uploadLink.click();
    
    await expect(page).toHaveURL('/upload');
  });

  test('History link navigates to history page', async ({ page }) => {
    await page.goto('/');
    
    const historyLink = page.getByRole('link', { name: /history/i });
    await historyLink.click();
    
    await expect(page).toHaveURL('/history');
  });

  test('active state highlights current page - home', async ({ page }) => {
    await page.goto('/');
    
    const learnLink = page.getByRole('link', { name: /learn/i });
    await expect(learnLink).toHaveClass(/bg-purple/);
  });

  test('active state highlights current page - upload', async ({ page }) => {
    await page.goto('/upload');
    
    const uploadLink = page.getByRole('link', { name: /upload/i });
    await expect(uploadLink).toHaveClass(/bg-purple/);
  });

  test('active state highlights current page - history', async ({ page }) => {
    await page.goto('/history');
    
    const historyLink = page.getByRole('link', { name: /history/i });
    await expect(historyLink).toHaveClass(/bg-purple/);
  });

  test('logo click navigates to home', async ({ page }) => {
    await page.goto('/upload');
    
    const logo = page.locator('aside').getByRole('link').first();
    await logo.click();
    
    await expect(page).toHaveURL('/');
  });

  test('sidebar is visible on upload page', async ({ page }) => {
    await page.goto('/upload');
    
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });

  test('sidebar is visible on history page', async ({ page }) => {
    await page.goto('/history');
    
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });
});
