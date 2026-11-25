# demoTest: Sauce Demo UI Automation

UI test automation for [Sauce Demo](https://www.saucedemo.com) using **Playwright + TypeScript** and the Page Object Model.

Test design, strategy and rationale: [`docs/TEST_DESIGN.md`](docs/TEST_DESIGN.md)

## Setup

```bash
npm install
npx playwright install chromium
```

## Run

```bash
npm test               # full suite
npm run test:smoke     # only @smoke tests
npm run test:regression # all @regression tests
npm run test:headed    # watch the browser
npm run test:ui        # Playwright UI mode
npm run report         # open the HTML report
```

## Structure

```
docs/          test design document
pages/         page objects (locators + actions, no assertions)
fixtures/      shared setup (page objects, logged-in state)
tests/         specs; test titles carry the case IDs from the design doc
test-data/     external test data (JSON)
```

## Implemented cases

| Case | Spec |
|------|------|
| TC-LOGIN-01..05 | `tests/login.spec.ts` |
| TC-CHK-01..02 | `tests/checkout.spec.ts` |
