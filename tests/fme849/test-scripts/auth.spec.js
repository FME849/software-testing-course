// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Auth Module (AUTH)', () => {

  test('TC-AUTH-001: Register New Account with Valid Credentials', async ({ page, authPage, catalogPage }) => {
    await authPage.gotoRegister();

    const uniqueEmail = `user_${Date.now()}@example.com`;
    await authPage.register('Jane Smith', uniqueEmail, 'securepass123', 'securepass123');

    // Should redirect to homepage and show greeting
    await expect(page).toHaveURL(/\/(index\.html)?$/);
    await expect(catalogPage.authArea).toContainText('Hi, Jane Smith');
    await expect(catalogPage.logoutBtn).toBeVisible();
  });

  test('TC-AUTH-002: Register Account with Mismatched Passwords', async ({ page, authPage }) => {
    await authPage.gotoRegister();

    await authPage.register('Jane Smith', 'mismatch@example.com', 'pass123', 'diff456');

    // Should stay on register page with error
    await expect(authPage.regErrorAlert).toBeVisible();
    await expect(authPage.regErrorAlert).toContainText('Passwords do not match');
    await expect(page).toHaveURL(/\/register\.html/);
  });

  test('TC-AUTH-003: Register Account with Already Registered Email', async ({ authPage }) => {
    await authPage.gotoRegister();

    // Use demo@techmart.com which already exists
    await authPage.register('Demo User', 'demo@techmart.com', 'pass123', 'pass123');

    // Expect server error
    await expect(authPage.regErrorAlert).toBeVisible();
    await expect(authPage.regErrorAlert).toContainText('Email already registered');
  });

  test('TC-AUTH-004: Login with Valid Demo Credentials', async ({ page, authPage, catalogPage }) => {
    await authPage.gotoLogin();

    await authPage.login('demo@techmart.com', 'demo123');

    // Should redirect to homepage and show user name
    await expect(page).toHaveURL(/\/(index\.html)?$/);
    await expect(catalogPage.authArea).toContainText('Hi, Demo User');
    await expect(catalogPage.logoutBtn).toBeVisible();
  });

  test('TC-AUTH-005: Login Failure with Incorrect Password', async ({ page, authPage }) => {
    await authPage.gotoLogin();

    await authPage.login('demo@techmart.com', 'wrongpassword');

    // Should stay on login and show error
    await expect(authPage.loginErrorAlert).toBeVisible();
    await expect(authPage.loginErrorAlert).toContainText('Invalid credentials');
    await expect(page).toHaveURL(/\/login\.html/);
  });

  test('TC-AUTH-006: User Logout and Header State Reset', async ({ page, authPage, catalogPage }) => {
    // First log in
    await authPage.gotoLogin();
    await authPage.login('demo@techmart.com', 'demo123');
    await page.waitForURL('/');
    await expect(catalogPage.authArea).toContainText('Hi, Demo User');

    // Click logout
    await page.locator('#logoutBtn').click();

    // Header resets to Login and Sign Up
    await expect(catalogPage.authArea).toContainText('Login');
    await expect(catalogPage.authArea).not.toContainText('Hi, Demo User');
  });
});
