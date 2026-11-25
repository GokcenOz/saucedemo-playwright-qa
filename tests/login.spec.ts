import { test, expect } from '../fixtures';
import users from '../test-data/users.json';

test.describe('Authentication', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('TC-LOGIN-01: Successful login with valid credentials', { tag: ['@smoke', '@regression'] }, async ({
    page,
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.login(users.valid.username, users.valid.password);

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventoryPage.items).toHaveCount(6);
    await expect(inventoryPage.cartLink).toBeVisible();
    await expect(inventoryPage.cartBadge).toBeHidden();
  });

  // TC-LOGIN-02: one generated test per data row
  for (const data of users.invalidLoginCases) {
    test(`TC-LOGIN-02: Login fails with invalid credentials (${data.name})`, { tag: ['@smoke', '@regression'] }, async ({
      page,
      loginPage,
    }) => {
      await loginPage.login(data.username, data.password);

      await expect(loginPage.errorMessage).toHaveText(data.error);
      await expect(page).not.toHaveURL(/inventory\.html/);
    });
  }

  test('TC-LOGIN-03: Locked-out user cannot log in', { tag: ['@smoke', '@regression'] }, async ({ loginPage }) => {
    await loginPage.login(users.locked.username, users.locked.password);

    await expect(loginPage.errorMessage).toHaveText(
      'Epic sadface: Sorry, this user has been locked out.'
    );
  });

  test('TC-LOGIN-04: Protected page cannot be accessed without login', { tag: ['@smoke', '@regression'] }, async ({
    page,
    loginPage,
  }) => {
    await page.goto('/inventory.html');

    await expect(loginPage.errorMessage).toContainText("You can only access '/inventory.html'");
    await expect(loginPage.loginButton).toBeVisible();
  });
});

test('TC-LOGIN-05: Logout ends the session', { tag: '@regression' }, async ({
  page,
  loginPage,
  loggedInInventoryPage,
}) => {
  await loggedInInventoryPage.logout();

  await expect(loginPage.loginButton).toBeVisible();
  await expect(page).not.toHaveURL(/inventory\.html/);

  await page.goBack();

  await expect(page).not.toHaveURL(/inventory\.html/);
  await expect(loginPage.loginButton).toBeVisible();
});
