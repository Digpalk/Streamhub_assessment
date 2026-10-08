'use strict';

const { When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');
const { parseCurrency } = require('../../utils/emiCalculator');
const { scheduleYearCount } = require('../../utils/schedule');

// Note: the "Given I launch ..." and "Given I navigate to the {string} tab"
// steps are reused from emi.steps.js (Cucumber matches step text globally).

When(
  'I set the loan amount slider to {int}, the interest rate slider to {float} and the tenure slider to {int} years',
  async function (amount, rate, years) {
    this.input = { amount, rate, years };
    await this.emiPage.setLoanDetailsViaSliders({ amount, rate, years });
  }
);

When('I change the schedule start month to {string} using the calendar widget', async function (monthAbbr) {
  this.startDate = await this.emiPage.setStartMonth(monthAbbr);
  assert.ok(
    new RegExp(`^${monthAbbr}\\b`, 'i').test(this.startDate),
    `Expected the start month to change to "${monthAbbr}" but the widget shows "${this.startDate}".`
  );
});

Then('the EMI payment bar chart should be visible and available', async function () {
  const visible = await this.emiPage.isBarChartVisible();
  assert.ok(visible, 'Expected the EMI payment bar chart to be visible and available, but it was not.');
});

Then(
  'the number of bars in the bar chart should match the number of years in the schedule',
  async function () {
    const { barCount, categories, rectCount } = await this.emiPage.getBarChartInfo();
    const expected = scheduleYearCount(this.startDate, this.input.years);

    this.attach(
      `Bars: ${barCount} (years: ${categories.join(', ')}); ` +
        `column segments: ${rectCount}; expected years: ${expected}`
    );

    assert.ok(barCount > 0, 'Expected at least one bar in the chart.');
    assert.equal(
      barCount,
      expected,
      `Expected ${expected} bars (one stacked bar per schedule year) but the chart has ${barCount}.`
    );
  }
);

Then(
  'the tooltip of a single bar should display values that match the chart data',
  async function () {
    const t = await this.emiPage.hoverBarTooltip();
    assert.ok(t.tooltipText, 'No tooltip was displayed when hovering a bar.');

    // Parse "Label : ₹ 12,345" pairs out of the tooltip text.
    const pairs = {};
    const re = /([A-Za-z ]+?)\s*:\s*₹?\s*([\d,]+(?:\.\d+)?)/g;
    let m;
    while ((m = re.exec(t.tooltipText))) {
      pairs[m[1].trim()] = parseCurrency(m[2]);
    }
    this.attach(`Tooltip: "${t.tooltipText}" -> ${JSON.stringify(pairs)}`);

    // The year in the tooltip must match the bar that was hovered.
    assert.equal(
      pairs.Year,
      t.hoverYear,
      `Tooltip year ${pairs.Year} does not match the hovered bar's year ${t.hoverYear}.`
    );

    // Every monetary value shown in the tooltip must be greater than zero.
    const monetary = Object.entries(pairs).filter(([label]) => label !== 'Year');
    assert.ok(monetary.length >= 1, 'Tooltip did not contain any monetary values.');
    for (const [label, value] of monetary) {
      assert.ok(
        Number.isFinite(value) && value > 0,
        `Tooltip "${label}" should be greater than zero but was ${value}.`
      );
    }

    // Validate the displayed figures against the chart's own series data.
    const idx = t.categories.indexOf(t.hoverYear);
    const seriesPrincipal = Math.round(t.principal[idx]);
    const seriesInterest = Math.round(t.interest[idx]);
    const seriesTotal = seriesPrincipal + seriesInterest;

    if ('Principal' in pairs) {
      assert.ok(
        Math.abs(pairs.Principal - seriesPrincipal) <= 1,
        `Tooltip Principal Rs.${pairs.Principal} does not match chart data Rs.${seriesPrincipal}.`
      );
    }
    if ('Interest' in pairs) {
      assert.ok(
        Math.abs(pairs.Interest - seriesInterest) <= 1,
        `Tooltip Interest Rs.${pairs.Interest} does not match chart data Rs.${seriesInterest}.`
      );
    }
    if ('Total Payment' in pairs) {
      assert.ok(
        Math.abs(pairs['Total Payment'] - seriesTotal) <= 1,
        `Tooltip Total Payment Rs.${pairs['Total Payment']} does not match principal + interest Rs.${seriesTotal}.`
      );
    }
  }
);
