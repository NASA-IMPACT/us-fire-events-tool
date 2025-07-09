Feature: URL Filter State Sharing
  As a user
  I want to be able to share specific views created by the application's filters in a URL
  So that I can collaborate with others by sharing my exact filter configurations and enable them to see the same data view I'm looking at

  Background:
    Given I am on the wildfire explorer page
    And the application has loaded successfully

  Scenario: URL updates when filters are applied
    Given I have the default filter settings loaded
    When I apply a time range filter from "2023-01-01" to "2023-12-31"
    And I select a region filter for "California"
    And I set a minimum fire area filter of "1000" acres
    Then the URL should contain the time range parameters
    And the URL should contain the region parameter
    And the URL should contain the fire area parameter
    And the URL should remain readable and not excessively long

  Scenario: Shared URL restores exact filter state
    Given I have a shared URL with specific filter parameters
    When I navigate to that URL
    Then all filters should be automatically applied
    And the time range should match the URL parameters
    And the region filter should match the URL parameters
    And the fire area filter should match the URL parameters
    And the map should display the same filtered results

  Scenario: Invalid URL parameters are handled gracefully
    Given I have a URL with invalid filter parameters
    When I navigate to that URL
    Then the application should fallback to default filter settings
    And the application should display an appropriate message or indication
    And the URL should be updated to reflect the corrected filter state 