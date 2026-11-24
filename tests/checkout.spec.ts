import { test, expect } from '../fixtures';
import checkout from '../test-data/checkout.json';

test.describe('Checkout', () => {
  test('TC-CHK-01: Complete purchase end to end', { tag: '@smoke' }, async ({
    loggedInInventoryPage: inventory,
    cartPage,
    checkoutPage,
  }) => {
    // Step 1: add products and remember their prices for the total check
    let expectedItemTotal = 0;
    for (const product of checkout.products) {
      expectedItemTotal += await inventory.priceOf(product);
      await inventory.addToCart(product);
    }
    await expect(inventory.cartBadge).toHaveText(String(checkout.products.length));

    // Step 2: open cart and start checkout
    await inventory.openCart();
    await expect(cartPage.itemNames).toHaveText(checkout.products);
    await cartPage.checkout();

    // Step 3: customer information
    await checkoutPage.fillCustomerInfo(checkout.customer);
    await checkoutPage.continue();

    // Step 4: overview - items and price summary
    await expect(checkoutPage.overviewItemNames).toHaveText(checkout.products);
    const itemTotal = await checkoutPage.itemTotal();
    const tax = await checkoutPage.tax();
    const total = await checkoutPage.total();
    expect(itemTotal).toBeCloseTo(expectedItemTotal, 2);
    expect(total).toBeCloseTo(itemTotal + tax, 2);

    // Step 5: finish
    await checkoutPage.finish();
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    await expect(inventory.cartBadge).toBeHidden();
  });

  for (const data of checkout.missingRequiredFields) {
    test(
      `TC-CHK-02: Checkout form rejects missing required fields (${data.name})`,
      { tag: '@regression' },
      async ({ loggedInInventoryPage: inventory, cartPage, checkoutPage, page }) => {
        await inventory.addToCart(checkout.products[0]);
        await inventory.openCart();
        await cartPage.checkout();

        await checkoutPage.fillCustomerInfo(data.customer);
        await checkoutPage.continue();

        await expect(checkoutPage.errorMessage).toBeVisible();
        await expect(checkoutPage.errorMessage).toHaveText(data.expectedError);
        await expect(page).toHaveURL(/checkout-step-one\.html/);
      }
    );
  }
});
