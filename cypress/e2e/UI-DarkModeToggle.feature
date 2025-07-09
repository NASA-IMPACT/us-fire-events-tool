# Associated user story: ../../stories/UI-DarkModeToggle.story.md

Feature: Dark Mode Toggle
  As a user
  I want to be able to switch the app's appearance between light mode and dark mode using a toggle in the header component
  So that I can reduce eye strain in low-light environments and personalize my viewing experience

  Scenario: User toggles dark mode in the header
    Given I am on the app's main page
    When I see the dark mode toggle in the header
    And I switch the toggle to dark mode
    Then the app's color scheme changes to dark mode
    And the preference is saved so that dark mode remains enabled when I reopen the app
    And all major UI components and text remain readable and visually consistent in dark mode 