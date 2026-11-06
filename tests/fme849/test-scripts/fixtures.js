// @ts-check
const base = require('@playwright/test');
const { CatalogPage } = require('./pages/CatalogPage');
const { CartPage } = require('./pages/CartPage');
const { AuthPage } = require('./pages/AuthPage');
const { CheckoutPage } = require('./pages/CheckoutPage');

/**
 * Custom Playwright Test Fixtures for TechMart (fme849)
 * - Injects isolated Page Object instances on demand
 * - Handles auto-reset for cart and authentication state
 */
exports.test = base.test.extend({
  // Page Object Model Fixtures
  catalogPage: async ({ page }, use) => {
    await use(new CatalogPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  // Auto fixture: resets session cart before each test to maintain clean state
  resetCart: [async ({ request }, use) => {
    await request.delete('http://localhost:3000/api/cart');
    await use();
  }, { auto: true }],

  // Auto fixture: ensures clean logout before each test to avoid session leaks
  resetAuth: [async ({ request }, use) => {
    await request.post('http://localhost:3000/api/logout');
    await use();
  }, { auto: true }],
});

exports.expect = base.expect;
