// Cucumber configuration (CommonJS).
// Docs: https://github.com/cucumber/cucumber-js/blob/main/docs/configuration.md
module.exports = {
  default: {
    // Where the Gherkin feature files live
    paths: ['features/**/*.feature'],
    // Step definitions and support code (World + hooks) to load
    require: [
      'features/step_definitions/**/*.js',
      'features/support/**/*.js',
    ],
    // Console progress + machine/human readable reports under reports/
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json',
    ],
    formatOptions: { snippetInterface: 'async-await' },
  },
};
