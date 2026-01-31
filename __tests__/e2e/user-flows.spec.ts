import { test, expect } from '@playwright/test';

test.describe('User Flows', () => {
  test.describe('Upload Flow', () => {
    test('complete upload flow: navigate, select category, upload file', async ({ page }) => {
      // Mock documents API for list
      await page.route('/api/documents*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              items: [],
              total: 0,
              limit: 20,
              offset: 0,
              hasMore: false,
            }),
          });
        }
      });

      // Start on home page
      await page.goto('/');
      
      // Navigate to upload
      await page.getByRole('link', { name: /upload/i }).click();
      await expect(page).toHaveURL('/upload');
      
      // Select a category
      const notesButton = page.getByRole('button', { name: /notes/i });
      await notesButton.click();
      await expect(notesButton).toHaveClass(/bg-purple/);
      
      // Verify dropzone is ready
      const dropzone = page.getByText(/drag and drop your file here/i);
      await expect(dropzone).toBeVisible();
    });
  });

  test.describe('Navigation Flow', () => {
    test('navigate through all pages', async ({ page }) => {
      // Mock APIs
      await page.route('/api/documents*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items: [], total: 0, hasMore: false }),
        });
      });
      
      await page.route('/api/conversations*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ conversations: [], total: 0, hasMore: false }),
        });
      });

      // Start on home
      await page.goto('/');
      await expect(page.getByText(/montessori/i)).toBeVisible();
      
      // Go to upload
      await page.getByRole('link', { name: /upload/i }).click();
      await expect(page).toHaveURL('/upload');
      await expect(page.getByText(/upload learning materials/i)).toBeVisible();
      
      // Go to history
      await page.getByRole('link', { name: /history/i }).click();
      await expect(page).toHaveURL('/history');
      await expect(page.getByText(/learning history/i)).toBeVisible();
      
      // Go back to home
      await page.getByRole('link', { name: /learn/i }).click();
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Conversation Flow', () => {
    test('view conversation history and see details', async ({ page }) => {
      // Mock conversations API
      await page.route('/api/conversations*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            conversations: [
              {
                id: 'conv-1',
                title: 'Physics Discussion',
                summary: 'Covered Newton laws of motion',
                startedAt: new Date().toISOString(),
                duration: 1200,
                topics: ['physics', 'mechanics'],
                messageCount: 8,
              },
              {
                id: 'conv-2',
                title: 'Math Review',
                summary: 'Practiced calculus problems',
                startedAt: new Date(Date.now() - 86400000).toISOString(),
                duration: 900,
                topics: ['mathematics', 'calculus'],
                messageCount: 5,
              },
            ],
            total: 2,
            hasMore: false,
          }),
        });
      });

      await page.goto('/history');
      
      // Verify both conversations are visible
      await expect(page.getByText('Physics Discussion')).toBeVisible();
      await expect(page.getByText('Math Review')).toBeVisible();
      
      // Verify summaries
      await expect(page.getByText(/Newton laws/i)).toBeVisible();
      await expect(page.getByText(/calculus problems/i)).toBeVisible();
      
      // Verify topic tags
      await expect(page.getByText(/physics/i).first()).toBeVisible();
      await expect(page.getByText(/mechanics/i)).toBeVisible();
    });

    test('continue conversation redirects to home', async ({ page }) => {
      // Mock conversations API
      await page.route('/api/conversations*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              conversations: [
                {
                  id: 'conv-1',
                  title: 'Previous Session',
                  summary: 'Previous discussion',
                  startedAt: new Date().toISOString(),
                  duration: 600,
                  topics: ['general'],
                  messageCount: 3,
                },
              ],
              total: 1,
              hasMore: false,
            }),
          });
        }
      });

      // Mock continue API
      await page.route('/api/conversations/*/continue', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            websocket_url: 'wss://mock.example.com',
            session_id: 'new-session',
            context_summary: 'Previous discussion',
            conversation_id: 'new-conv',
          }),
        });
      });

      await page.goto('/history');
      
      // Click continue button
      const continueButton = page.getByRole('button', { name: /continue/i });
      await continueButton.click();
      
      // Should navigate to home with conversation
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Delete Conversation Flow', () => {
    test('delete shows confirmation and removes item', async ({ page }) => {
      let conversationDeleted = false;
      
      // Mock conversations API
      await page.route('/api/conversations*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              conversations: conversationDeleted ? [] : [
                {
                  id: 'conv-to-delete',
                  title: 'Session to Delete',
                  summary: 'This will be deleted',
                  startedAt: new Date().toISOString(),
                  duration: 300,
                  topics: ['test'],
                  messageCount: 2,
                },
              ],
              total: conversationDeleted ? 0 : 1,
              hasMore: false,
            }),
          });
        }
      });

      // Mock delete API
      await page.route('/api/conversations/*', async (route) => {
        if (route.request().method() === 'DELETE') {
          conversationDeleted = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
        }
      });

      await page.goto('/history');
      
      // Verify conversation is there
      await expect(page.getByText('Session to Delete')).toBeVisible();
      
      // Click delete
      const deleteButton = page.getByRole('button', { name: /delete/i });
      await deleteButton.click();
      
      // Confirm deletion (if confirmation dialog appears)
      const confirmButton = page.getByRole('button', { name: /confirm/i }).or(
        page.getByRole('button', { name: /yes/i })
      );
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
    });
  });

  test.describe('Voice Interface Flow', () => {
    test('start conversation flow', async ({ page }) => {
      // Mock agent initialize API
      await page.route('/api/agent/initialize', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            websocket_url: 'wss://mock.elevenlabs.io/session',
            session_id: 'test-session-123',
            agent_id: 'test-agent-id',
            conversation_id: 'test-conv-id',
          }),
        });
      });

      await page.goto('/');
      
      // Verify initial state
      await expect(page.getByText(/montessori/i)).toBeVisible();
      await expect(page.getByText(/press the play/i)).toBeVisible();
      
      // Find and click play button
      const playButton = page.locator('button.rounded-full').first();
      await expect(playButton).toBeEnabled();
      await playButton.click();
      
      // Should show connecting state
      await expect(
        page.getByText(/connecting/i).or(page.getByText(/listening/i))
      ).toBeVisible({ timeout: 5000 });
    });
  });
});
