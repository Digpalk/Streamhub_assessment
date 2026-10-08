# UI Test Cases — EMI Calculator (Playwright + Cucumber)

Automated BDD UI tests for the EMI calculator at
**https://emicalculator.net/**, written with **Playwright** (browser automation)
driven through **Cucumber** (Gherkin / BDD).

## What is tested

**Test Case 1 — Validate the EMI pie chart** (`features/emi-pie-chart.feature`)

For each data set the suite:

1. Launches the application.
2. Navigates to the **Home Loan** tab.
3. Enters loan amount, interest rate and tenure.
4. Calculates the EMI independently in code and asserts it matches the EMI shown
   by the application (within ±₹2 for rounding).
5. Verifies the payment break-up **pie chart** is visible and available.
6. Extracts the numeric value of **both** pie sections (Principal loan amount and
   Total Interest) and passes only if both are greater than zero.

| Scenario | Loan amount | Interest rate | Tenure  |
| -------- | ----------- | ------------- | ------- |
| A        | ₹25,00,000  | 10%           | 10 yrs  |
| B        | ₹50,00,000  | 7.5%          | 15 yrs  |

**Test Case 2 — Validate the EMI bar chart** (`features/emi-bar-chart.feature`)

The suite:

1. Launches the application.
2. Navigates to the **Personal Loan** tab.
3. Sets loan amount, interest rate and tenure by **dragging the sliders** (the
   handle is dragged to position, then nudged with arrow keys to land exactly on
   the target value).
4. Changes the schedule start month via the **calendar widget**
   ("Schedule showing EMI payments starting from").
5. Verifies the yearly EMI payment **bar chart** is visible and available.
6. Counts the bars (one stacked Principal + Interest bar per year) and asserts
   the count equals the number of calendar years the schedule spans.
7. Hovers a single bar, reads its **tooltip**, and validates the displayed
   values are greater than zero *and* match the chart's own series data
   (e.g. Total Payment = Principal + Interest for that year).

| Scenario | Loan amount | Interest rate | Tenure | Start month |
| -------- | ----------- | ------------- | ------ | ----------- |
| Personal | ₹10,00,000  | 12%           | 5 yrs  | January     |

## Project layout

```
UI Test Cases/
├── cucumber.js                        # Cucumber config (paths, requires, reporters)
├── features/
│   ├── emi-pie-chart.feature          # Test Case 1 — Home Loan EMI + pie chart
│   ├── emi-bar-chart.feature          # Test Case 2 — Personal Loan bar chart
│   ├── step_definitions/
│   │   ├── emi.steps.js               # Shared launch/navigate + pie-chart steps
│   │   └── bar.steps.js               # Slider / calendar / bar-chart steps
│   └── support/
│       ├── world.js                   # Custom World (browser/context/page refs)
│       └── hooks.js                   # Browser lifecycle + screenshot-on-failure
├── pages/emiCalculatorPage.js         # Page Object — all selectors + actions
├── utils/
│   ├── emiCalculator.js               # Pure EMI math + currency parsing
│   └── schedule.js                    # Schedule year-span helper (bar count)
└── reports/                           # Generated HTML + JSON reports (gitignored)
```

## Setup

> Requires Node.js (tested on v20). Run all commands from inside the
> `UI Test Cases` folder.

```bash
npm install
npx playwright install chromium
```

## Run

```bash
npm test              # headless
npm run test:headed   # watch it run in a real browser window
npm run report        # open the generated HTML report (Windows)
```

Reports are written to `reports/cucumber-report.html` and
`reports/cucumber-report.json`. On failure a full-page screenshot is attached to
the report automatically.

### Optional environment variables

| Variable | Effect                                             |
| -------- | -------------------------------------------------- |
| `HEADED` | Any value runs the browser headed (visible).       |
| `SLOWMO` | Milliseconds to slow each action by (e.g. `250`).  |

## Notes

- The suite runs against the live emicalculator.net site, so an internet
  connection is required.
- All selectors are centralized in `pages/emiCalculatorPage.js`; if the site's
  markup changes, that is the only file to update.
