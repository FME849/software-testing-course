// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Cart Module (CRT)', () => {

  test('TC-CRT-001: Add Product to Cart from Homepage Grid', async ({ page, catalogPage }) => {
    await catalogPage.goto();
    await expect(page.locator('#cartCount').first()).toHaveText('0');

    // Add first item
    await catalogPage.addToCart();

    // Verify toast & badge counter increment
    await expect(catalogPage.toast).toContainText('Added to cart');
    await expect(page.locator('#cartCount').first()).toHaveText('1');
  });

  test('TC-CRT-002: Add Same Product Multiple Times and Verify Quantity Increment', async ({ page, catalogPage, cartPage }) => {
    await catalogPage.goto();

    // Click Add to Cart 3 times
    const firstProductBtn = catalogPage.productCards.first().getByRole('button', { name: 'Add to Cart' });
    await firstProductBtn.click();
    await expect(page.locator('#cartCount').first()).toHaveText('1');

    await firstProductBtn.click();
    await expect(page.locator('#cartCount').first()).toHaveText('2');

    await firstProductBtn.click();
    await expect(page.locator('#cartCount').first()).toHaveText('3');

    // Verify on Cart Page that item quantity is 3
    await cartPage.goto();
    await expect(cartPage.cartItems).toHaveCount(1);
    await expect(cartPage.cartItems.first().locator('.qty-value')).toHaveText('3');
  });

  test('TC-CRT-003: View Cart Items and Verify Subtotal & Totals Calculation', async ({ catalogPage, cartPage }) => {
    await catalogPage.goto();

    // Add Wireless Headphones ($79.99)
    await catalogPage.addToCart('Wireless Headphones');
    // Add USB-C Hub ($49.99)
    await catalogPage.addToCart('USB-C Hub');

    // Navigate to Cart
    await cartPage.goto();
    await expect(cartPage.cartItems).toHaveCount(2);

    // Verify Subtotal & Total
    await expect(cartPage.subtotal).toHaveText('$129.98');
    await expect(cartPage.total).toHaveText('$129.98');
    await expect(cartPage.checkoutBtn).toBeVisible();
  });

  test('TC-CRT-004: Increase and Decrease Item Quantity on Cart Page', async ({ page, catalogPage, cartPage }) => {
    await catalogPage.goto();
    await catalogPage.addToCart('Wireless Headphones');

    await cartPage.goto();
    const itemRow = cartPage.getItemRow('Wireless Headphones');

    // Increase quantity to 2
    await cartPage.increaseQuantity('Wireless Headphones');
    await expect(itemRow.locator('.qty-value')).toHaveText('2');
    await expect(cartPage.subtotal).toHaveText('$159.98');

    // Decrease quantity back to 1
    await cartPage.decreaseQuantity('Wireless Headphones');
    await expect(itemRow.locator('.qty-value')).toHaveText('1');
    await expect(cartPage.subtotal).toHaveText('$79.99');

    // Decrease again: should remove item and show empty cart container
    await cartPage.decreaseQuantity('Wireless Headphones');
    await expect(cartPage.emptyCartMessage).toBeVisible();
    await expect(page.locator('#cartContent')).toBeHidden();
  });

  test('TC-CRT-005: Remove Single Item from Cart Using Delete Button', async ({ catalogPage, cartPage }) => {
    await catalogPage.goto();
    await catalogPage.addToCart('Wireless Headphones');
    await catalogPage.addToCart('USB-C Hub');

    await cartPage.goto();
    await expect(cartPage.cartItems).toHaveCount(2);

    // Remove Wireless Headphones
    await cartPage.removeItem('Wireless Headphones');

    // Only USB-C Hub should remain
    await expect(cartPage.cartItems).toHaveCount(1);
    await expect(cartPage.getItemRow('USB-C Hub')).toBeVisible();
    await expect(cartPage.getItemRow('Wireless Headphones')).toHaveCount(0);
    await expect(cartPage.total).toHaveText('$49.99');
  });

  test('TC-CRT-006: Empty Cart Page Display and Start Shopping Redirect', async ({ catalogPage, cartPage }) => {
    await cartPage.goto();

    await expect(cartPage.emptyCartMessage).toBeVisible();
    await expect(cartPage.startShoppingBtn).toBeVisible();

    // Click Start Shopping button
    await cartPage.startShoppingBtn.click();

    // Verify redirected back to catalog
    await expect(catalogPage.heroTitle).toBeVisible();
    await expect(catalogPage.productCards).toHaveCount(6);
  });
});
