Feature: Personal Loan EMI payment schedule bar chart
  As a user of the EMI Calculator
  I want the yearly EMI payment bar chart to reflect my personal loan schedule
  So that I can see how principal and interest are paid off each year

  Background:
    Given I launch the EMI Calculator application
    And I navigate to the "Personal Loan" tab

  Scenario: Validate the EMI payment bar chart for a personal loan
    When I set the loan amount slider to 1000000, the interest rate slider to 12 and the tenure slider to 5 years
    And I change the schedule start month to "Jan" using the calendar widget
    Then the EMI payment bar chart should be visible and available
    And the number of bars in the bar chart should match the number of years in the schedule
    And the tooltip of a single bar should display values that match the chart data
