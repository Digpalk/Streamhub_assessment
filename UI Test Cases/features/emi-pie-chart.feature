Feature: Home Loan EMI and payment break-up pie chart
  As a user of the EMI Calculator
  I want the Home Loan EMI and its payment break-up pie chart to be correct
  So that I can trust the figures shown by the application

  Background:
    Given I launch the EMI Calculator application
    And I navigate to the "Home Loan" tab

  Scenario Outline: Validate calculated EMI and pie chart break-up
    When I enter a loan amount of <amount>, an interest rate of <rate>% and a tenure of <years> years
    Then the EMI shown in the application should match my calculated EMI
    And the payment break-up pie chart should be visible and available
    And both sections of the pie chart should show a value greater than zero

    Examples:
      | amount  | rate | years |
      | 2500000 | 10   | 10    |
      | 5000000 | 7.5  | 15    |
