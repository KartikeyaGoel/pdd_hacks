import { test, expect } from '@playwright/test';

test.describe('Upload Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the documents API
    await page.route('/api/documents*', async (route) => {
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
    });
  });

  test('page loads with Upload Learning Materials heading', async ({ page }) => {
    await page.goto('/upload');
    
    const heading = page.getByRole('heading', { name: /upload learning materials/i });
    await expect(heading).toBeVisible();
  });

  test('category buttons are visible', async ({ page }) => {
    await page.goto('/upload');
    
    // Check for category buttons (Study Materials, Reference Docs, Notes, Other)
    const studyMaterials = page.getByRole('button', { name: /study materials/i });
    const referenceDocs = page.getByRole('button', { name: /reference docs/i });
    const notes = page.getByRole('button', { name: /notes/i });
    const other = page.getByRole('button', { name: /other/i });
    
    await expect(studyMaterials).toBeVisible();
    await expect(referenceDocs).toBeVisible();
    await expect(notes).toBeVisible();
    await expect(other).toBeVisible();
  });

  test('category selection changes active state', async ({ page }) => {
    await page.goto('/upload');
    
    const notesButton = page.getByRole('button', { name: /notes/i });
    await notesButton.click();
    
    await expect(notesButton).toHaveClass(/bg-purple/);
  });

  test('dropzone is visible', async ({ page }) => {
    await page.goto('/upload');
    
    // The dropzone text is "Drag and drop your file here, or click to browse"
    const dropzone = page.getByText(/drag and drop your file here/i);
    await expect(dropzone).toBeVisible();
  });

  test('dropzone shows supported formats', async ({ page }) => {
    await page.goto('/upload');
    
    // The actual text: "Supports PDF, DOCX, TXT, MD, PNG, JPG (max 10MB)"
    const formats = page.getByText(/supports pdf.*docx.*txt/i);
    await expect(formats).toBeVisible();
  });

  test('empty state shows when no documents', async ({ page }) => {
    await page.goto('/upload');
    
    // The actual text: "No documents uploaded yet"
    const emptyState = page.getByText(/no documents uploaded yet/i);
    await expect(emptyState).toBeVisible();
  });

  test('document list section is visible', async ({ page }) => {
    await page.goto('/upload');
    
    // The "Your Documents" heading should be visible
    const heading = page.getByRole('heading', { name: /your documents/i });
    await expect(heading).toBeVisible();
  });

  test('refresh button is visible', async ({ page }) => {
    await page.goto('/upload');
    
    // The Refresh button should be visible
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await expect(refreshButton).toBeVisible();
  });
});
