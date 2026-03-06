/**
 * Handoff E2E tests (Cypress)
 * Tests the Handoff UI loads and core interactions work.
 * Note: Chat API calls the deployed Vercel backend; tests are resilient to API errors.
 */

/** Complete the onboarding overlay so the workspace becomes visible */
function completeOnboarding() {
  cy.get('#bizDescInput').type('web design agency');
  cy.get('#step1Next').click();
  cy.get('.ob-revenue-pill').first().click();
  cy.get('#step2Next').click();
  cy.get('#locationInput').type('Toronto');
  cy.get('#step3Next').click();
  cy.get('#nameInput').type('TestCo');
  cy.get('#step4Next').click();
  // Step 5 — click Build (intercept the API call so it doesn't hang)
  cy.intercept('POST', '**/api/chat**', { statusCode: 200, body: { reply: '<h1>Test</h1>' } }).as('chat');
  cy.get('#buildBtn').click();
}

describe('Handoff', () => {
  beforeEach(() => {
    cy.visit('/projects/handoff/index.html');
  });

  it('loads the Handoff page and shows onboarding', () => {
    cy.get('header').should('be.visible');
    cy.get('.logo').should('contain', 'Handoff');
    cy.get('#onboardingOverlay').should('be.visible');
    cy.get('#obStep1').should('be.visible');
    cy.get('#bizDescInput').should('be.visible');
  });

  it('onboarding Next button enables when text is entered', () => {
    cy.get('#step1Next').should('be.disabled');
    cy.get('#bizDescInput').type('coffee shop');
    cy.get('#step1Next').should('not.be.disabled');
  });

  it('shows chat panel and preview panel after onboarding', () => {
    completeOnboarding();
    cy.get('#messages').should('be.visible');
    cy.get('#chatInput').should('be.visible');
    cy.get('#sendBtn').should('be.visible');
    cy.get('#previewFrame').should('exist');
  });

  it('has deploy and edit mode buttons after onboarding', () => {
    completeOnboarding();
    cy.get('#deployBtn').should('exist');
    cy.get('#editModeBtn').should('exist');
  });
});
