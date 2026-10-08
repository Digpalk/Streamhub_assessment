'use strict';

const { parseCurrency } = require('../utils/emiCalculator');

const APP_URL = 'https://emicalculator.net/';

/**
 * Page Object for the emicalculator.net Home Loan calculator.
 * Every selector lives here so that, if the live site changes, there is exactly
 * one place to update.
 */
class EmiCalculatorPage {
  /** @param {import('playwright').Page} page */
  constructor(page) {
    this.page = page;
    this.selectors = {
      loanAmount: '#loanamount',
      interestRate: '#loaninterest',
      tenure: '#loanterm',
      emi: '#emiamount',
      totalInterest: '#emitotalinterest',
      totalPayment: '#emitotalamount',
      pieChart: '#emipiechart',
      barChart: '#emibarchart',
    };
  }

  async open() {
    await this.page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await this.page
      .locator(this.selectors.loanAmount)
      .waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Navigate to a calculator tab (e.g. "Home Loan"). The landing page already
   * defaults to the Home Loan calculator, so clicking is best-effort: we try the
   * common roles for a tab control and fall back to a no-op if none is found.
   */
  async goToTab(tabName) {
    const pattern = new RegExp(`^\\s*${tabName}\\s*$`, 'i');
    for (const role of ['tab', 'link', 'button']) {
      const el = this.page.getByRole(role, { name: pattern }).first();
      try {
        await el.waitFor({ state: 'visible', timeout: 1500 });
        await el.click();
        break;
      } catch (_) {
        // try the next role; if none match we are already on the Home Loan tab
      }
    }
    await this.page
      .locator(this.selectors.loanAmount)
      .waitFor({ state: 'visible', timeout: 30000 });
  }

  /** Clear a field and type the value so the site's keyup handlers recalculate. */
  async _setInput(selector, value) {
    const el = this.page.locator(selector);
    await el.click();
    await el.press('Control+A');
    await el.press('Delete');
    await el.pressSequentially(String(value), { delay: 30 });
    await el.press('Tab');
  }

  /** @param {{ amount: number, rate: number, years: number }} details */
  async enterLoanDetails({ amount, rate, years }) {
    await this._setInput(this.selectors.loanAmount, amount);
    await this._setInput(this.selectors.interestRate, rate);
    await this._setInput(this.selectors.tenure, years);
    // Give the client-side script a moment to recompute and redraw the chart.
    await this.page.waitForTimeout(600);
    await this.page
      .locator(this.selectors.emi)
      .waitFor({ state: 'visible', timeout: 15000 });
  }

  async getDisplayedEmi() {
    return parseCurrency(await this.page.locator(this.selectors.emi).innerText());
  }

  async getDisplayedTotalInterest() {
    return parseCurrency(await this.page.locator(this.selectors.totalInterest).innerText());
  }

  async getDisplayedTotalPayment() {
    return parseCurrency(await this.page.locator(this.selectors.totalPayment).innerText());
  }

  /** The pie chart is "available" when its container is visible and holds an SVG. */
  async isPieChartVisible() {
    const chart = this.page.locator(this.selectors.pieChart);
    await chart.scrollIntoViewIfNeeded().catch(() => {});
    const visible = await chart.isVisible().catch(() => false);
    const hasSvg = (await chart.locator('svg').count()) > 0;
    return visible && hasSvg;
  }

  /**
   * Extract the numeric value of both pie sections (Principal loan amount and
   * Total Interest).
   *   Primary:  read the Highcharts series data directly (exact rupee amounts).
   *   Fallback: parse the numbers rendered inside the chart SVG text.
   * @returns {Promise<{ principal: number, interest: number }>}
   */
  async getPieChartSectionValues() {
    const viaHighcharts = await this.page.evaluate(() => {
      const H = window.Highcharts;
      if (!H || !Array.isArray(H.charts)) return null;
      const chart =
        H.charts.find((c) => c && c.renderTo && c.renderTo.id === 'emipiechart') ||
        H.charts.find(
          (c) => c && c.series && c.series[0] && c.series[0].type === 'pie'
        );
      if (!chart || !chart.series || !chart.series[0]) return null;
      return chart.series[0].data.map((p) => ({ name: p.name, y: p.y }));
    });

    if (viaHighcharts && viaHighcharts.length) {
      let principal;
      let interest;
      for (const point of viaHighcharts) {
        const name = String(point.name || '').toLowerCase();
        if (name.includes('interest')) interest = point.y;
        else principal = point.y;
      }
      if (principal === undefined) principal = viaHighcharts[0] && viaHighcharts[0].y;
      if (interest === undefined) interest = viaHighcharts[1] && viaHighcharts[1].y;
      return { principal: Number(principal), interest: Number(interest) };
    }

    // Fallback: read numeric text rendered inside the chart SVG.
    const texts = await this.page
      .locator(`${this.selectors.pieChart} text, ${this.selectors.pieChart} tspan`)
      .allInnerTexts()
      .catch(() => []);
    const numbers = texts.map(parseCurrency).filter((n) => Number.isFinite(n) && n > 0);
    return { principal: numbers[0], interest: numbers[1] };
  }

  // ----- Sliders (jQuery UI) -------------------------------------------------

  /** Read a jQuery UI slider's min/max/step via the page's own jQuery instance. */
  async _sliderOptions(sliderId) {
    return this.page.evaluate((id) => {
      const $s = window.jQuery('#' + id);
      return {
        min: $s.slider('option', 'min'),
        max: $s.slider('option', 'max'),
        step: $s.slider('option', 'step'),
      };
    }, sliderId);
  }

  /**
   * Set a jQuery UI slider to an exact value by dragging the handle to the
   * computed position and then nudging with arrow keys to land precisely on the
   * target (jQuery UI sliders move one step per Left/Right arrow press).
   * @param {string} sliderId e.g. 'loanamountslider'
   * @param {string} inputId  linked field that reflects the value, e.g. 'loanamount'
   * @param {number} target
   * @returns {Promise<number>} the value actually reached
   */
  async setSliderValue(sliderId, inputId, target) {
    const { min, max, step } = await this._sliderOptions(sliderId);
    const track = await this.page.locator('#' + sliderId).boundingBox();
    const handle = this.page.locator(`#${sliderId} .ui-slider-handle`);
    const hb = await handle.boundingBox();

    let x = track.x + ((target - min) / (max - min)) * track.width;
    x = Math.max(track.x, Math.min(track.x + track.width, x));
    const y = track.y + track.height / 2;

    // Drag the handle to the approximate position.
    await this.page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(x, y, { steps: 20 });
    await this.page.mouse.up();

    // Snap precisely onto the target with keyboard steps.
    await handle.focus();
    const input = this.page.locator('#' + inputId);
    for (let i = 0; i < 100; i++) {
      const current = parseCurrency(await input.inputValue());
      if (Math.abs(current - target) < step / 2) break;
      await handle.press(current < target ? 'ArrowRight' : 'ArrowLeft');
      await this.page.waitForTimeout(15);
    }
    return parseCurrency(await input.inputValue());
  }

  /**
   * Drive all three sliders (amount, interest, tenure).
   * @param {{ amount: number, rate: number, years: number }} details
   */
  async setLoanDetailsViaSliders({ amount, rate, years }) {
    await this.setSliderValue('loanamountslider', 'loanamount', amount);
    await this.setSliderValue('loaninterestslider', 'loaninterest', rate);
    await this.setSliderValue('loantermslider', 'loanterm', years);
    await this.page.waitForTimeout(400);
  }

  // ----- Start-month calendar widget ----------------------------------------

  async getLoanStartDate() {
    return (await this.page.locator('#loanstartdate').inputValue()).trim();
  }

  /**
   * Open the "Schedule showing EMI payments starting from" calendar widget
   * (a bootstrap-datepicker in month view) and pick a month. If that month is
   * disabled in the year shown, advance a year and retry.
   * @param {string} monthAbbr e.g. 'Jan'
   * @returns {Promise<string>} the resulting start date, e.g. 'Jan 2026'
   */
  async setStartMonth(monthAbbr) {
    const field = this.page.locator('#startmonthyear');
    await field.scrollIntoViewIfNeeded();
    await field.click();
    const picker = this.page.locator('.datepicker-dropdown');
    await picker.waitFor({ state: 'visible', timeout: 5000 });

    for (let attempt = 0; attempt < 4; attempt++) {
      const cell = picker
        .locator('.datepicker-months .month', { hasText: new RegExp(`^${monthAbbr}$`) })
        .first();
      const cls = (await cell.getAttribute('class')) || '';
      if (/disabled/.test(cls)) {
        await picker.locator('.datepicker-months .next').click();
        await this.page.waitForTimeout(200);
        continue;
      }
      await cell.click();
      break;
    }
    await picker.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    await this.page.waitForTimeout(400);
    return this.getLoanStartDate();
  }

  // ----- Bar chart (#emibarchart) -------------------------------------------

  /** The bar chart is "available" when its container is visible and holds an SVG. */
  async isBarChartVisible() {
    const chart = this.page.locator(this.selectors.barChart);
    await chart.scrollIntoViewIfNeeded().catch(() => {});
    const visible = await chart.isVisible().catch(() => false);
    const hasSvg = (await chart.locator('svg').count()) > 0;
    return visible && hasSvg;
  }

  /**
   * @returns {Promise<{categories:number[], barCount:number, rectCount:number}>}
   * barCount = number of stacked year-bars; rectCount = total column segments
   * (each year bar is Principal + Interest = 2 segments).
   */
  async getBarChartInfo() {
    return this.page.evaluate(() => {
      const H = window.Highcharts;
      const c = H.charts
        .filter(Boolean)
        .find((x) => x.renderTo && x.renderTo.id === 'emibarchart');
      const categories = c.xAxis[0].categories;
      return {
        categories,
        barCount: categories.length,
        rectCount: document.querySelectorAll('#emibarchart .highcharts-series rect').length,
      };
    });
  }

  /**
   * Hover a single bar (the Principal segment of the first year) to reveal its
   * tooltip, and return the rendered tooltip text together with the underlying
   * Highcharts series data so the caller can validate what the tooltip shows.
   */
  async hoverBarTooltip() {
    const chart = this.page.locator(this.selectors.barChart);
    await chart.scrollIntoViewIfNeeded();
    const principalBar = chart.locator('.highcharts-series-1 rect').first();
    await principalBar.hover({ force: true });
    await this.page.waitForTimeout(400);

    // Retry the hover once if the tooltip did not render.
    if ((await this.page.locator('.highcharts-tooltip').count()) === 0) {
      const box = await principalBar.boundingBox();
      if (box) await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await this.page.waitForTimeout(400);
    }

    return this.page.evaluate(() => {
      const H = window.Highcharts;
      const c = H.charts
        .filter(Boolean)
        .find((x) => x.renderTo && x.renderTo.id === 'emibarchart');
      const hp = c.hoverPoint;
      const byName = {};
      c.series.forEach((s) => {
        byName[s.name] = s.data.map((p) => p.y);
      });
      const el = document.querySelector('.highcharts-tooltip');
      return {
        hoverYear: hp ? hp.category : null,
        hoverSeries: hp && hp.series ? hp.series.name : null,
        categories: c.xAxis[0].categories,
        principal: byName['Principal'] || [],
        interest: byName['Interest'] || [],
        tooltipText: el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '',
      };
    });
  }
}

module.exports = { EmiCalculatorPage };
