# Test Design Document: Sauce Demo E-Commerce

**Application under test:** [Sauce Demo](https://www.saucedemo.com) (public demo web shop)
**Automation tool:** Playwright + TypeScript
**Author:** Gokcen
**Version:** 1.0

---

## 1. Scope and Application Overview

Sauce Demo is a simplified online store. A user logs in, browses a product catalog, adds items to a cart, and completes a three-step checkout.

### 1.1 Critical business flows

| # | Flow | Why it matters |
|---|------|----------------|
| 1 | Authentication (login / logout / access control) | Gatekeeper for every other feature. A defect here blocks all revenue and can expose protected pages. |
| 2 | Cart management | Directly affects purchase intent. Wrong item counts or lost items cause abandoned orders. |
| 3 | Checkout and order completion | The revenue-generating step. Wrong totals or a broken form means lost sales and customer distrust. |
| 4 | Product browsing and sorting | Drives product discovery. A defect rarely blocks a purchase but hurts conversion. |

### 1.2 In scope

- Login, logout, session/access control
- Product listing and sorting
- Add to cart / remove from cart, cart badge, cart page
- Checkout steps one, two and completion (form validation, price summary)

### 1.3 Out of scope

- Visual/pixel-perfect testing, cross-browser matrix beyond Chromium, performance and load testing, accessibility audits, mobile native apps. They are valuable but not needed to demonstrate the core automation strategy (see Section 7 for future work).

### 1.4 Test data (provided by the application)

| User | Purpose |
|------|---------|
| `standard_user` | Happy path |
| `locked_out_user` | Negative: blocked account |
| `problem_user` | Known UI defects (useful for defect detection) |
| `performance_glitch_user` | Slow responses (tests wait strategy) |

Shared password: `secret_sauce`. Credentials are stored in `test-data/users.json`, never hardcoded in tests.

---

## 2. Risk Analysis and Prioritization

| Area | Likelihood of defect | Business impact | Risk | Priority |
|------|---------------------|-----------------|------|----------|
| Login / access control | Medium | Critical | High | **P1** |
| Checkout flow and totals | Medium | Critical | High | **P1** |
| Cart management | Medium | High | Medium-High | **P2** |
| Checkout form validation | High | Medium | Medium | **P2** |
| Sorting / listing | Medium | Low-Medium | Low-Medium | **P3** |

Prioritization rule: **Risk = Likelihood x Impact.** P1 cases are intended for the smoke suite; P2 and P3 are intended for the full regression. The current implementation is smaller than this planned scope (see Section 7).

---

## 3. Test Strategy

### 3.1 Test level and approach

- **UI end-to-end tests** against the deployed application. They verify real user journeys, which is the main risk for an e-commerce site.
- Tests are **independent**: each test sets up its own state and does not rely on other tests. Login tests start from the login page; checkout uses a fixture that logs in through the UI.
- **Smoke vs. regression:** implemented P1 cases are tagged `@smoke`; implemented P2/P3 cases use `@regression`. Remaining regression cases are planned. CI runs smoke tests on pushes and the full suite on pull requests.

### 3.2 Test design techniques

| Technique | Where applied |
|-----------|---------------|
| Equivalence partitioning | Login users (valid, invalid, locked), checkout form field groups |
| Boundary value analysis | Empty vs. single vs. multiple cart items; empty/whitespace/very long input |
| Negative testing | Wrong credentials, empty fields, missing form data, direct URL access without login |
| State-transition testing | Cart state (empty -> items added -> item removed -> checkout -> empty after order) |
| Data-driven testing | Login negative cases and missing checkout-field cases are implemented; sorting options are planned |

### 3.3 Automation design

- **Page Object Model (POM):** `LoginPage`, `InventoryPage`, `CartPage`, `CheckoutPage`. Locators and actions live in page objects; assertions stay in tests.
- **Locators:** prefer `data-test` attributes and role-based locators (`getByRole`, `getByTestId`) over CSS/XPath for stability.
- **Fixtures:** the `loggedInInventoryPage` fixture logs in through the UI for each test that needs an authenticated session. It does not use `storageState`; login tests intentionally exercise the login flow directly.
- **Waits:** rely on Playwright auto-waiting and web-first assertions (`expect(locator).toBeVisible()`). No fixed `sleep` calls.
- **Test data:** externalized in `test-data/*.json`.
- **Reporting and debugging:** HTML report, traces and screenshots on failure (`trace: 'on-first-retry'`).
- **CI:** GitHub Actions runs the smoke suite on each push and the full suite on pull requests.

### 3.4 What is automated vs. manual

| Implemented in this project | Planned or kept manual / exploratory |
|-----------|--------------------------|
| TC-LOGIN-01..05 and TC-CHK-01..02 | Remaining P2/P3 cases; visual design review, usability, exploratory testing of `problem_user` behavior, accessibility review |

---

## 4. Rationale

**Why Playwright + TypeScript?**
- Auto-waiting and web-first assertions reduce flaky tests compared with manual waits.
- Built-in tracing, video, screenshots and parallel execution reduce debugging time and CI run time.
- TypeScript gives type safety for page objects and test data, which helps maintainability as the suite grows.

**Why Sauce Demo?**
- Stable, public, and requires no registration, so the reviewer can reproduce every result.
- It contains the core flows of a real e-commerce application (auth, catalog, cart, checkout) with real business rules such as validation messages and a tax-inclusive order summary.
- Built-in special users allow testing of negative and defect scenarios without modifying the app.

**Why this prioritization?**
Tests are ordered by business risk, not by page order. A failure in login or checkout stops revenue completely, so these get the deepest coverage (positive, negative and edge). Sorting is lower risk, so it gets lighter, data-driven coverage.

**Why end-to-end UI tests and not API tests?**
The application exposes no public API, and the main risk lies in user-visible behavior. In a real product I would push validation logic down to API/unit level and keep only critical journeys at the UI level (test pyramid).

---

## 5. Test Case Format

| Field | Description |
|-------|-------------|
| ID | `TC-<AREA>-<NN>` |
| Priority | P1 / P2 / P3 |
| Type | Positive / Negative / Edge |
| Preconditions | State required before the test |
| Steps | Numbered, one action per step |
| Test data | Values used |
| Expected result | Observable, verifiable outcome |
| Implementation status | `Video` (implemented and selected for the live coding session), `Implemented`, or `Planned` |

---

## 6. Test Cases

### 6.1 Authentication (LOGIN)

#### TC-LOGIN-01: Successful login with valid credentials
- **Priority:** P1 | **Type:** Positive | **Implementation:** Implemented
- **Preconditions:** User is on the login page (`/`).
- **Test data:** `standard_user` / `secret_sauce`
- **Steps:**
  1. Enter the username.
  2. Enter the password.
  3. Click **Login**.
- **Expected result:**
  - User is redirected to `/inventory.html`.
  - The product list shows 6 items.
  - The cart icon is visible and its badge is not displayed.

#### TC-LOGIN-02: Login fails with invalid credentials  `[Video, data-driven]`
- **Priority:** P1 | **Type:** Negative | **Implementation:** Video
- **Preconditions:** User is on the login page.
- **Test data (one run per row):**

| Username | Password | Expected error message |
|----------|----------|------------------------|
| `standard_user` | `wrong_password` | `Epic sadface: Username and password do not match any user in this service` |
| `unknown_user` | `secret_sauce` | `Epic sadface: Username and password do not match any user in this service` |
| *(empty)* | `secret_sauce` | `Epic sadface: Username is required` |
| `standard_user` | *(empty)* | `Epic sadface: Password is required` |
| *(empty)* | *(empty)* | `Epic sadface: Username is required` |

- **Steps:**
  1. Enter the username (if provided).
  2. Enter the password (if provided).
  3. Click **Login**.
- **Expected result:** User stays on the login page and the matching error message is shown. No inventory page is displayed.

#### TC-LOGIN-03: Locked-out user cannot log in
- **Priority:** P1 | **Type:** Negative | **Implementation:** Implemented
- **Test data:** `locked_out_user` / `secret_sauce`
- **Steps:** Enter credentials and click **Login**.
- **Expected result:** Error `Epic sadface: Sorry, this user has been locked out.` is shown; user stays on the login page.

#### TC-LOGIN-04: Protected page cannot be accessed without login
- **Priority:** P1 | **Type:** Negative (security) | **Implementation:** Implemented
- **Preconditions:** No active session.
- **Steps:** Open `/inventory.html` directly.
- **Expected result:** User is redirected to the login page with an error stating that the page can only be accessed when logged in.

#### TC-LOGIN-05: Logout ends the session
- **Priority:** P2 | **Type:** Positive | **Implementation:** Implemented
- **Preconditions:** Logged in as `standard_user`.
- **Steps:**
  1. Open the burger menu.
  2. Click **Logout**.
  3. Use the browser back button.
- **Expected result:** User is returned to the login page; going back does not restore access to the inventory page.

#### TC-LOGIN-06: Username with surrounding whitespace
- **Priority:** P3 | **Type:** Edge | **Implementation:** Planned
- **Test data:** ` standard_user ` (leading and trailing spaces) / `secret_sauce`
- **Expected result:** Login is rejected with the "do not match" error (usernames are matched exactly).

### 6.2 Product Catalog and Sorting (CATALOG)

#### TC-CATALOG-01: Sorting options order products correctly (data-driven)
- **Priority:** P3 | **Type:** Positive | **Implementation:** Planned
- **Preconditions:** Logged in as `standard_user`.
- **Test data:** Name (A to Z), Name (Z to A), Price (low to high), Price (high to low)
- **Steps:** Select each sort option from the dropdown.
- **Expected result:** The displayed names or prices are in the expected order (compared against a sorted copy of the list read from the page).

#### TC-CATALOG-02: Product list shows complete product data
- **Priority:** P3 | **Type:** Positive | **Implementation:** Planned
- **Expected result:** Every product shows a name, description, price and an **Add to cart** button.

#### TC-CATALOG-03: Cart contents persist after sorting
- **Priority:** P3 | **Type:** Edge | **Implementation:** Planned
- **Steps:** Add one product, change the sort order.
- **Expected result:** The added product still shows **Remove** and the cart badge still shows `1`.

### 6.3 Cart (CART)

#### TC-CART-01: Add a single product to the cart
- **Priority:** P2 | **Type:** Positive | **Implementation:** Planned
- **Preconditions:** Logged in; cart empty.
- **Steps:** Click **Add to cart** on "Sauce Labs Backpack", then open the cart.
- **Expected result:** Badge shows `1`; button changes to **Remove**; the cart page lists the product with quantity 1 and the correct price.

#### TC-CART-02: Add multiple products
- **Priority:** P2 | **Type:** Positive | **Implementation:** Planned
- **Steps:** Add three different products.
- **Expected result:** Badge shows `3`; the cart page lists exactly those three products.

#### TC-CART-03: Remove a product from the inventory page and from the cart page
- **Priority:** P2 | **Type:** Positive | **Implementation:** Planned
- **Steps:** Add two products, remove one on the inventory page, remove the other on the cart page.
- **Expected result:** Badge decreases after each removal and disappears at zero; the cart page becomes empty.

#### TC-CART-04: Cart persists across navigation
- **Priority:** P2 | **Type:** Edge | **Implementation:** Planned
- **Steps:** Add a product, open a product detail page, return to the list, open the cart.
- **Expected result:** The product is still in the cart and the badge is unchanged.

### 6.4 Checkout (CHK)

#### TC-CHK-01: Complete purchase end to end  `[Video]`
- **Priority:** P1 | **Type:** Positive | **Implementation:** Video
- **Preconditions:** Logged in as `standard_user`; cart empty.
- **Test data:** Products "Sauce Labs Backpack" and "Sauce Labs Bike Light"; customer `John / Doe / 12345`
- **Steps:**
  1. Add both products to the cart.
  2. Open the cart and click **Checkout**.
  3. Fill in first name, last name and postal code; click **Continue**.
  4. On the overview page, review items and the price summary.
  5. Click **Finish**.
- **Expected result:**
  - Overview lists exactly the two selected products.
  - Item total equals the sum of the item prices.
  - Total equals item total plus tax (tax is shown separately).
  - Completion page shows `Thank you for your order!`.
  - Cart badge is no longer displayed after the order.

#### TC-CHK-02: Checkout form rejects missing required fields (data-driven)
- **Priority:** P2 | **Type:** Negative | **Implementation:** Implemented
- **Test data:**

| First name | Last name | Postal code | Expected error |
|-----------|-----------|-------------|----------------|
| *(empty)* | `Doe` | `12345` | `Error: First Name is required` |
| `John` | *(empty)* | `12345` | `Error: Last Name is required` |
| `John` | `Doe` | *(empty)* | `Error: Postal Code is required` |

- **Expected result:** User stays on checkout step one and the matching error is shown.

#### TC-CHK-03: Cancel checkout keeps the cart intact
- **Priority:** P2 | **Type:** Edge | **Implementation:** Planned
- **Steps:** Start checkout with items in the cart, click **Cancel** on step one, then on step two.
- **Expected result:** User returns to the cart / inventory page and the cart contents are unchanged.

#### TC-CHK-04: Checkout with an empty cart
- **Priority:** P2 | **Type:** Negative / Edge | **Implementation:** Planned
- **Preconditions:** Logged in; cart empty.
- **Steps:** Open the cart and click **Checkout**.
- **Expected result (business rule):** The application should not allow checkout without items.
- **Note:** Sauce Demo is known to allow this, which conflicts with the expected business rule. When this planned case is automated, mark it as a *known defect* (`test.fail()`) so it flags the gap without breaking the pipeline.

#### TC-CHK-05: Unusual input in checkout form
- **Priority:** P3 | **Type:** Edge | **Implementation:** Planned
- **Test data:** Very long strings (255+ chars), special characters (`<script>`, `'`, `ö ç ş`), whitespace-only values.
- **Expected result:** The form does not break, no script is executed, and input is either accepted safely or rejected with a clear message.

---

## 7. Coverage Summary

The table below describes the **designed coverage**, not the currently automated coverage.

| Area | Positive | Negative | Edge | Total |
|------|---------:|---------:|-----:|------:|
| Login | 2 | 3 | 1 | 6 |
| Catalog | 2 | 0 | 1 | 3 |
| Cart | 3 | 0 | 1 | 4 |
| Checkout | 1 | 2 | 2 | 5 |
| **Total** | **8** | **5** | **5** | **18** |

(Data-driven cases such as TC-LOGIN-02 and TC-CHK-02 each execute several data rows.)

### 7.1 Current implementation status

| Status | Test cases | Executed test instances |
|--------|------------|-------------------------|
| Implemented | TC-LOGIN-01..05, TC-CHK-01..02 | 13 (LOGIN-02 has five rows; CHK-02 has three) |
| Planned | TC-LOGIN-06, TC-CATALOG-01..03, TC-CART-01..04, TC-CHK-03..05 | Not implemented |

### 7.2 Selected for live coding video

| Case | Reason |
|------|--------|
| **TC-LOGIN-02** | Demonstrates negative authentication, data-driven test design and precise error-message assertions. |
| **TC-CHK-01** | Demonstrates a full end-to-end P1 journey across the shop and checkout, including price calculation assertions. |

These are the two cases selected for the live coding session, matching the assessment's 1–2 case requirement.

### 7.3 Future improvements

- Cross-browser matrix (Firefox, WebKit) and mobile viewports
- Visual regression checks for `visual_user`
- Accessibility checks (axe-core integration)
- API-level tests for validation logic if an API becomes available
- Test reporting dashboard and flaky-test tracking

---

## 8. Traceability

Each automated test is named with its case ID, for example:

```ts
test('TC-LOGIN-01: Successful login with valid credentials', async ({ loginPage }) => { ... });
```

This links the code in `tests/` directly to this document.
