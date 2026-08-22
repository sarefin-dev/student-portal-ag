import { test, expect } from '@playwright/test';

test.describe('Public Course Catalog', () => {
  test('navigates from catalog to course details', async ({ page }) => {
    await page.goto('/');

    // Check landing page has the Browse Courses button
    const browseBtn = page.getByRole('button', { name: 'Browse Courses' });
    await expect(browseBtn).toBeVisible();
    await browseBtn.click();

    // Verify we reached the catalog
    await expect(page).toHaveURL(/.*\/courses/);
    await expect(page.getByRole('heading', { name: 'Course Catalog' })).toBeVisible();

    // In a real DB test, we'd click a course card here
    // const firstCourseBtn = page.getByRole('button', { name: 'View Details' }).first();
    // await firstCourseBtn.click();
    // await expect(page.getByRole('button', { name: 'Enroll Now' })).toBeVisible();
  });
});
