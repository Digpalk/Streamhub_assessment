'use strict';

const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');
const { calculateEmi } = require('../../utils/emiCalculator');

// Tolerance (in rupees) to absorb rounding differences between our calculation
// and the application's own rounding.
const EMI_TOLERANCE = 2;

Given('I launch the EMI Calculator application', async function () {
  await this.emiPage.open();
});

Given('I navigate to the {string} tab', async function (tabName) {
  await this.emiPage.goToTab(tabName);
});

When(
  'I enter a loan amount of {int}, an interest rate of {float}% and a tenure of {int} years',
  async function (amount, rate, years) {
    this.input = { amount, rate, years };
    await this.emiPage.enterLoanDetails({ amount, rate, years });
  }
);

Then('the EMI shown in the application should match my calculated EMI', async function () {
  const { amount, rate, years } = this.input;
  const expected = calculateEmi(amount, rate, years);
  const actual = await this.emiPage.getDisplayedEmi();

  assert.ok(
    Number.isFinite(actual),
    `Could not read a numeric EMI from the application (got: ${actual}).`
  );

  const diff = Math.abs(expected - actual);
  assert.ok(
    diff <= EMI_TOLERANCE,
    `EMI mismatch: calculated Rs.${expected} but the application showed Rs.${actual} ` +
      `(difference Rs.${diff}, allowed Rs.${EMI_TOLERANCE}).`
  );
});

Then('the payment break-up pie chart should be visible and available', async function () {
  const visible = await this.emiPage.isPieChartVisible();
  assert.ok(visible, 'Expected the payment break-up pie chart to be visible and available, but it was not.');
});

Then('both sections of the pie chart should show a value greater than zero', async function () {
  const { principal, interest } = await this.emiPage.getPieChartSectionValues();

  assert.ok(
    Number.isFinite(principal) && principal > 0,
    `Pie chart principal section should be greater than zero but was: ${principal}`
  );
  assert.ok(
    Number.isFinite(interest) && interest > 0,
    `Pie chart interest section should be greater than zero but was: ${interest}`
  );
});
