// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Edge Cases & Security Module (EDGE)', () => {

  test('TC-EDGE-001: Search Input Resilience Against Script Injection (XSS)', async ({ page, catalogPage }) => {
    await catalogPage.goto();

    // Listen for unexpected alert events
    let alertTriggered = false;
    page.on('dialog', async dialog => {
      alertTriggered = true;
      await dialog.dismiss();
    });

    // Attempt XSS payload in search input
    await catalogPage.search('<script>alert("xss")</script>');

    // Wait a brief window to confirm no dialog was invoked
    await page.waitForTimeout(500);
    expect(alertTriggered).toBe(false);

    // Page must remain fully interactive and render empty search results
    await expect(catalogPage.productCards).toHaveCount(0);
    await expect(catalogPage.noProductsMessage).toBeVisible();
    await expect(catalogPage.logo).toBeVisible();
  });

  test('TC-EDGE-002: Search Input with Whitespace Only', async ({ catalogPage }) => {
    await catalogPage.goto();

    // Fill search with whitespace
    await catalogPage.search('    ');

    // Should handle whitespace gracefully without crashing
    const cardCount = await catalogPage.productCards.count();
    const emptyVisible = await catalogPage.noProductsMessage.isVisible();
    expect(cardCount > 0 || emptyVisible).toBe(true);
    await expect(catalogPage.logo).toBeVisible();
  });

  test('TC-EDGE-003: Responsive Layout and Mobile Navigation on Small Screens', async ({ page, catalogPage }) => {
    // Emulate small smartphone viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await catalogPage.goto();

    // Verify key UI elements reflow cleanly without overflow
    await expect(catalogPage.logo).toBeVisible();
    await expect(catalogPage.cartLink).toBeVisible();
    await expect(catalogPage.productCards).toHaveCount(6);

    // Verify no horizontal scrolling exists on document
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // Add item on mobile viewport
    await catalogPage.addToCart();
    await expect(catalogPage.toast).toBeVisible();
  });
});
