import { test, expect, Page } from '@playwright/test';

const users = {
  admin: {
    email: 'admin-test@example.com',
    password: 'AdminUser!42#@Zy',
  },
  manager: {
    email: 'manager-test@example.com',
    password: 'TestUser!42#@Zy',
  },
  client: {
    email: 'client-test@example.com',
    password: 'TestUser!42#@Zy',
  },
};

const login = async (page: Page, email: string, password: string) => {
  await page.goto('/sign-in');
  await page.locator('input[name="identifier"]').fill(email);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.waitForURL('/dashboard');
};

test.describe('Role-based access control', () => {

  test.describe('Admin Role', () => {
    test('should be able to access admin panel', async ({ page }) => {
      await login(page, users.admin.email, users.admin.password);
      await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

      // Verify admin link is present and navigate
      await page.locator('nav').getByRole('link', { name: 'Admin' }).click();
      await page.waitForURL('/admin');
      await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

      // Check for key elements on the admin page
      await expect(page.getByRole('button', { name: 'Service Assignments' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Service Templates' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Form Builder' })).toBeVisible();
    });
  });

  test.describe('Manager Role', () => {
    test('should be able to log in and see the dashboard', async ({ page }) => {
      await login(page, users.manager.email, users.manager.password);
      await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
      
      // Verify admin link is NOT present
      await expect(page.locator('nav').getByRole('link', { name: 'Admin' })).not.toBeVisible();

      // Attempt to navigate to admin panel directly
      await page.goto('/admin');
      await expect(page).toHaveURL('/dashboard'); // Should be redirected
    });

    test('should be able to access service request page', async ({ page }) => {
        await login(page, users.manager.email, users.manager.password);
        await page.locator('nav').getByRole('link', { name: 'Services' }).click();
        await page.waitForURL('/services');
        await page.getByRole('link', { name: 'Submit Request' }).click();
        await page.waitForURL('/services/requests/new');
        await expect(page.locator('h1')).toHaveText('Submit Service Request');
    });
  });

  test.describe('Client Role', () => {
    test('should not be able to access admin panel', async ({ page }) => {
      await login(page, users.client.email, users.client.password);
      await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
      
      // Verify admin link is NOT present
      await expect(page.locator('nav').getByRole('link', { name: 'Admin' })).not.toBeVisible();

      // Attempt to navigate to admin panel directly
      await page.goto('/admin');
      await expect(page).toHaveURL('/dashboard'); // Should be redirected
    });

    test('should be able to access service request page', async ({ page }) => {
        await login(page, users.client.email, users.client.password);
        await page.locator('nav').getByRole('link', { name: 'Services' }).click();
        await page.waitForURL('/services');
        await page.getByRole('link', { name: 'Submit Request' }).click();
        await page.waitForURL('/services/requests/new');
        await expect(page.locator('h1')).toHaveText('Submit Service Request');
    });
  });
}); 