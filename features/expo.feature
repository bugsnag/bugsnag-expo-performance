Feature: Smoke tests

  Scenario: api key and app version are loaded from config
    When I wait to receive a sampling request
    And I wait to receive at least 1 span
