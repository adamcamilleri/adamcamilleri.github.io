# Testing

## Framework

- **Unit tests:** Jest 29 (`__tests__/`)
- **Integration tests:** supertest 6.3 (API tests against `require('../server').app`)
- **E2E tests:** Cypress 13 (`cypress/e2e/`)
- **Load tests:** JMeter 5.6 (`jmeter/`) — CI only

## Structure

- Unit tests live in `__tests__/`
- E2E tests live in `cypress/e2e/`
- JMeter load test plans in `jmeter/`

## Mocking

- No mocking in unit tests
- `cy.intercept` used in Cypress E2E for network stubbing

## Coverage

- No coverage thresholds enforced

## Notes

- Integration tests import the Express app directly via `require('../server').app`
- Load tests run in CI only, not locally by default
