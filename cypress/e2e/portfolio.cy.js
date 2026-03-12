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
    cy.contains('a', 'Projects').click();
    cy.url().should('include', '#projects');
    cy.get('.projects-list').should('be.visible');
  });

  it('has Handoff project link', () => {
    cy.contains('.project-card-h', 'Handoff').within(() => {
      cy.contains('View Project').should('have.attr', 'href');
    });
  });
});
