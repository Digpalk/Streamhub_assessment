'use strict';

const { setWorldConstructor, World } = require('@cucumber/cucumber');

/**
 * Custom Cucumber World. Holds the Playwright browser/context/page and the
 * page object for the duration of a scenario. The actual objects are created in
 * the Before hook (see hooks.js) and torn down in the After hook.
 */
class CustomWorld extends World {
  constructor(options) {
    super(options);
    /** @type {import('playwright').Browser|null} */
    this.browser = null;
    /** @type {import('playwright').BrowserContext|null} */
    this.context = null;
    /** @type {import('playwright').Page|null} */
    this.page = null;
    /** @type {import('../../pages/emiCalculatorPage').EmiCalculatorPage|null} */
    this.emiPage = null;
    /** @type {{ amount: number, rate: number, years: number }|null} */
    this.input = null;
  }
}

setWorldConstructor(CustomWorld);
