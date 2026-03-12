/**
 * Portfolio E2E tests (Cypress)
 */
describe('Portfolio', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('loads the home page', () => {
    // Scroll to About so scroll-reveal triggers (section starts with opacity: 0)
    cy.get('#about').scrollIntoView();
    cy.contains('Adam Camilleri', { timeout: 3000 }).should('be.visible');
  });

  it('navigates to projects section', () => {
    cy.get('#projects').scrollIntoView();
    cy.get('.projects-list', { timeout: 5000 }).should('be.visible');
  });

  it('has Handoff project link', () => {
    cy.get('#projects').scrollIntoView();
    cy.contains('.project-card-h', 'Handoff', { timeout: 5000 }).within(() => {
      cy.contains('View Project').should('have.attr', 'href');
    });
  });
});
