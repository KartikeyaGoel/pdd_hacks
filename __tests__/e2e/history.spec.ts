import { test, expect } from '@playwright/test';

test.describe('History Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the conversations API
    await page.route('/api/conversations*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          conversations: [],
          total: 0,
          hasMore: false,
        }),
      });
    });
  });

  test('page loads with Learning History heading', async ({ page }) => {
    await page.goto('/history');
    
    const heading = page.getByRole('heading', { name: /learning history/i });
    await expect(heading).toBeVisible();
  });

  test('empty state shows when no conversations', async ({ page }) => {
    await page.goto('/history');
    
    const emptyState = page.getByText(/no conversations/i).or(
      page.getByText(/start your first/i)
    );
    await expect(emptyState).toBeVisible();
  });

  test('conversation cards display correctly', async ({ page }) => {
    await page.route('/api/conversations*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          conversations: [
            {
              id: 'conv-1',
              title: 'Physics Lesson',
              summary: 'Discussed thermodynamics and heat transfer',
              startedAt: new Date().toISOString(),
              duration: 1800,
              topics: ['physics', 'thermodynamics'],
              messageCount: 10,
            },
          ],
          total: 1,
          hasMore: false,
        }),
      });
    });

    await page.goto('/history');
    
    const title = page.getByText('Physics Lesson');
    await expect(title).toBeVisible();
  });

  test('conversation shows summary', async ({ page }) => {
    await page.route('/api/conversations*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          conversations: [
            {
              id: 'conv-1',
              title: 'Test Session',
              summary: 'This is the conversation summary text',
              startedAt: new Date().toISOString(),
              duration: 900,
              topics: ['learning'],
              messageCount: 5,
            },
          ],
          total: 1,
          hasMore: false,
        }),
      });
    });

    await page.goto('/history');
    
    const summary = page.getByText(/conversation summary text/i);
    await expect(summary).toBeVisible();
  });

  test('conversation shows duration', async ({ page }) => {
    await page.route('/api/conversations*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          conversations: [
            {
              id: 'conv-1',
              title: 'Session',
              summary: 'Summary',
              startedAt: new Date().toISOString(),
              duration: 1800, // 30 minutes
              topics: [],
              messageCount: 5,
            },
          ],
          total: 1,
          hasMore: false,
        }),
      });
    });

    await page.goto('/history');
    
    // Duration should be displayed (30 min or similar)
    const duration = page.getByText(/30.*min/i);
    await expect(duration).toBeVisible();
  });

  test('topic tags are visible', async ({ page }) => {
    await page.route('/api/conversations*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          conversations: [
            {
              id: 'conv-1',
              title: 'Session',
              summary: 'Summary',
              startedAt: new Date().toISOString(),
              duration: 900,
              topics: ['physics', 'mathematics'],
              messageCount: 5,
            },
          ],
          total: 1,
          hasMore: false,
        }),
      });
    });

    await page.goto('/history');
    
    const physicsTag = page.getByText(/physics/i);
    const mathTag = page.getByText(/mathematics/i);
    await expect(physicsTag).toBeVisible();
    await expect(mathTag).toBeVisible();
  });

  test('Continue button is visible for conversations', async ({ page }) => {
    await page.route('/api/conversations*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          conversations: [
            {
              id: 'conv-1',
              title: 'Session',
              summary: 'Summary',
              startedAt: new Date().toISOString(),
              duration: 900,
              topics: [],
              messageCount: 5,
            },
          ],
          total: 1,
          hasMore: false,
        }),
      });
    });

    await page.goto('/history');
    
    const continueButton = page.getByRole('button', { name: /continue/i });
    await expect(continueButton).toBeVisible();
  });

  test('Delete button is visible for conversations', async ({ page }) => {
    await page.route('/api/conversations*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          conversations: [
            {
              id: 'conv-1',
              title: 'Session',
              summary: 'Summary',
              startedAt: new Date().toISOString(),
              duration: 900,
              topics: [],
              messageCount: 5,
            },
          ],
          total: 1,
          hasMore: false,
        }),
      });
    });

    await page.goto('/history');
    
    const deleteButton = page.getByRole('button', { name: /delete/i });
    await expect(deleteButton).toBeVisible();
  });

  test('Refresh button is visible', async ({ page }) => {
    await page.goto('/history');
    
    const refreshButton = page.getByRole('button', { name: /refresh/i }).or(
      page.locator('button').filter({ has: page.locator('svg') })
    );
    await expect(refreshButton).toBeVisible();
  });
});
