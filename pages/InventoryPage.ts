import { Locator, Page } from '@playwright/test';

/** Page object for the product list ("/inventory.html"). */
export class InventoryPage {
  readonly items: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly sortDropdown: Locator;

  constructor(private readonly page: Page) {
    this.items = page.getByTestId('inventory-item');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.sortDropdown = page.getByTestId('product-sort-container');
  }

  /** "Sauce Labs Backpack" -> "sauce-labs-backpack" (used in data-test ids). */
  private slug(productName: string): string {
    return productName.toLowerCase().replace(/\s+/g, '-');
  }

  async addToCart(productName: string): Promise<void> {
    await this.page.getByTestId(`add-to-cart-${this.slug(productName)}`).click();
  }

  async removeFromCart(productName: string): Promise<void> {
    await this.page.getByTestId(`remove-${this.slug(productName)}`).click();
  }

  async priceOf(productName: string): Promise<number> {
    const item = this.items.filter({ hasText: productName });
    const text = await item.getByTestId('inventory-item-price').innerText();
    return Number(text.replace('$', ''));
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async logout(): Promise<void> {
    await this.page.getByRole('button', { name: 'Open Menu' }).click();
    await this.page.getByTestId('logout-sidebar-link').click();
  }

  async sortBy(option: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }
}
