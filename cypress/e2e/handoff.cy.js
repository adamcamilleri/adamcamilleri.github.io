/**
 * Handoff E2E tests (Cypress)
 * Tests the Handoff UI loads and core interactions work.
 * Note: Chat API calls the deployed Vercel backend; tests are resilient to API errors.
 */
describe('Handoff', () => {
  beforeEach(() => {
    cy.visit('/projects/handoff/index.html');
  });

  it('loads the Handoff page', () => {
    cy.contains('Handoff').should('be.visible');
    cy.contains('Describe your website in detail').should('be.visible');
  });

  it('shows chat panel and preview panel', () => {
    cy.get('#messages').should('be.visible');
    cy.get('#chatInput').should('be.visible');
    cy.get('#sendBtn').should('be.visible');
    cy.get('#previewFrame').should('exist');
  });

  it('accepts input and send button is clickable', () => {
    cy.get('#chatInput').type('Make a simple landing page');
    cy.get('#chatInput').should('have.value', 'Make a simple landing page');
    cy.get('#sendBtn').click();
  });

  it('has deploy and edit mode buttons', () => {
    cy.get('#deployBtn').should('be.visible');
    cy.get('#editModeBtn').should('be.visible');
  });
});
