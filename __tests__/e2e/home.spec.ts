import { test, expect } from '@playwright/test';

test.describe('Home Page - Voice Interface', () => {
  test('page loads with Montessori heading', async ({ page }) => {
    await page.goto('/');
    
    const heading = page.getByRole('heading', { name: /montessori/i });
    await expect(heading).toBeVisible();
  });

  test('page shows AI Learning Coach subtitle', async ({ page }) => {
    await page.goto('/');
    
    const subtitle = page.getByText(/ai learning coach/i);
    await expect(subtitle).toBeVisible();
  });

  test('play button is visible', async ({ page }) => {
    await page.goto('/');
    
    // The play button is a large circular button
    const playButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(playButton).toBeVisible();
  });

  test('play button is clickable', async ({ page }) => {
    await page.goto('/');
    
    const playButton = page.locator('button.rounded-full').first();
    await expect(playButton).toBeEnabled();
  });

  test('instructions shown when not active', async ({ page }) => {
    await page.goto('/');
    
    const instructions = page.getByText(/press the play button/i);
    await expect(instructions).toBeVisible();
  });

  test('shows connecting state when play clicked', async ({ page }) => {
    await page.goto('/');
    
    // Mock the API response
    await page.route('/api/agent/initialize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          websocket_url: 'wss://mock.example.com',
          session_id: 'test-session',
          agent_id: 'test-agent',
          conversation_id: 'test-conv',
        }),
      });
    });

    const playButton = page.locator('button.rounded-full').first();
    await playButton.click();
    
    // Should show connecting state briefly
    const connectingText = page.getByText(/connecting/i);
    await expect(connectingText).toBeVisible({ timeout: 5000 });
  });

  test('page layout has sidebar offset', async ({ page }) => {
    await page.goto('/');
    
    const main = page.locator('main');
    await expect(main).toHaveClass(/ml-20/);
  });
});
