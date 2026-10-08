'use strict';

const {
  BeforeAll,
  AfterAll,
  Before,
  After,
  Status,
  setDefaultTimeout,
} = require('@cucumber/cucumber');
const { chromium } = require('playwright');
const { EmiCalculatorPage } = require('../../pages/emiCalculatorPage');

// UI steps hit a live third-party site, so give scenarios generous time.
setDefaultTimeout(60 * 1000);

// Shared across scenarios: one browser launch, a fresh context per scenario.
let browser;

BeforeAll(async function () {
  browser = await chromium.launch({
    headless: !process.env.HEADED,
    slowMo: process.env.SLOWMO ? Number(process.env.SLOWMO) : 0,
  });
});

AfterAll(async function () {
  if (browser) await browser.close();
});

Before(async function () {
  this.browser = browser;
  this.context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  this.page = await this.context.newPage();
  this.emiPage = new EmiCalculatorPage(this.page);
});

After(async function (scenario) {
  // Capture a screenshot and attach it to the report when a scenario fails.
  if (scenario.result && scenario.result.status === Status.FAILED && this.page) {
    const image = await this.page.screenshot({ fullPage: true });
    this.attach(image, 'image/png');
  }
  if (this.page) await this.page.close();
  if (this.context) await this.context.close();
});
