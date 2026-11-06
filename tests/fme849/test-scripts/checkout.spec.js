// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Checkout Module (CHK)', () => {

  test('TC-CHK-001: Complete Full End-to-End Checkout with Valid Shipping & Payment', async ({ catalogPage, checkoutPage }) => {
    // Add item to cart
    await catalogPage.goto();
    await catalogPage.addToCart('Wireless Headphones');

    // Go to checkout
    await checkoutPage.goto();
    await expect(checkoutPage.subtotal).toHaveText('$79.99');

    // Fill valid shipping
    await checkoutPage.fillShipping({
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main Street',
      city: 'Grand Rapids',
      state: 'MI',
      zip: '49501',
      phone: '555-123-4567'
    });

    // Fill valid payment
    await checkoutPage.fillPayment({
      cardName: 'John Doe',
      cardNumber: '4111 1111 1111 1111',
      expiry: '12/28',
      cvv: '123'
    });

    // Place order
    await checkoutPage.submitOrder();

    // Verify confirmation modal and order ID
    await expect(checkoutPage.orderConfirmationModal).toBeVisible();
    await expect(checkoutPage.orderIdSpan).not.toBeEmpty();
  });

  test('TC-CHK-002: Checkout Form Validation for Mandatory Shipping Fields', async ({ page, catalogPage, checkoutPage }) => {
    await catalogPage.goto();
    await catalogPage.addToCart('Wireless Headphones');

    await checkoutPage.goto();

    // Fill only first name, leave address, city, zip blank
    await checkoutPage.fillShipping({
      firstName: 'John',
      lastName: 'Doe'
    });

    await checkoutPage.submitOrder();

    // Browser HTML5 validation prevents submission; modal does not appear
    await expect(checkoutPage.orderConfirmationModal).toBeHidden();

    // Also test direct API rejection with incomplete shipping payload
    const apiRes = await page.request.post('http://localhost:3000/api/checkout', {
      data: {
        shipping: { firstName: 'John' }
      }
    });
    expect(apiRes.status()).toBe(400);
    const body = await apiRes.json();
    expect(body.error).toBe('Shipping information required');
  });

  test('TC-CHK-003: Prevent Checkout When Cart Is Empty', async ({ page, checkoutPage }) => {
    // Try visiting checkout with empty cart
    await checkoutPage.goto();

    // Frontend script automatically redirects empty carts to /cart.html
    await expect(page).toHaveURL(/\/cart\.html/);

    // Verify API level guard
    const apiRes = await page.request.post('http://localhost:3000/api/checkout', {
      data: {
        shipping: {
          address: '123 Street',
          city: 'Grand Rapids',
          zip: '49501'
        }
      }
    });
    expect(apiRes.status()).toBe(400);
    const body = await apiRes.json();
    expect(body.error).toBe('Cart is empty');
  });

  test('TC-CHK-004: Verify Inventory Stock Deduction After Successful Checkout', async ({ page, checkoutPage }) => {
    // Fetch initial stock for product 1
    const initialRes = await page.request.get('http://localhost:3000/api/products/1');
    const initialData = await initialRes.json();
    const initialStock = initialData.stock;

    // Add 2 units to cart
    await page.request.post('http://localhost:3000/api/cart', {
      data: { productId: 1, quantity: 2 }
    });

    // Complete order via checkout
    await checkoutPage.goto();
    await checkoutPage.fillShipping({
      firstName: 'Stock',
      lastName: 'Tester',
      address: '456 Warehouse Blvd',
      city: 'Detroit',
      state: 'MI',
      zip: '48201',
      phone: '555-987-6543'
    });
    await checkoutPage.fillPayment({
      cardName: 'Stock Tester',
      cardNumber: '4111 2222 3333 4444',
      expiry: '11/29',
      cvv: '999'
    });
    await checkoutPage.submitOrder();
    await expect(checkoutPage.orderConfirmationModal).toBeVisible();

    // Check updated stock via API
    const updatedRes = await page.request.get('http://localhost:3000/api/products/1');
    const updatedData = await updatedRes.json();
    expect(updatedData.stock).toBe(initialStock - 2);
  });
});
