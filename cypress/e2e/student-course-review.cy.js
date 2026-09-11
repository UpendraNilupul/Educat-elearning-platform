describe('Student - Course Review', () => {
  it('Submits a rating and written feedback for a completed class', () => {
    cy.viewport(1280, 720);

    cy.intercept('GET', '**/api/student/classes*').as('getClasses');

    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('std@example.com');
    cy.get('input[type="password"]').type('std123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.url().should('include', '/student');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    cy.get('aside').contains(/classes|completed|history/i).click();

    cy.wait('@getClasses', { timeout: 10000 });
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    cy.get('body').then(($body) => {
      if ($body.find(':contains("Review"), :contains("Rate")').length === 0) {
        throw new Error(
          '🛑 TEST HALTED: No completed classes available for review in the database. Ensure the student account has completed a course.'
        );
      }
    });

    cy.contains(/review|rate/i).first().click();

    // FIX: Use Cypress filter or find instead of .has()
    cy.get('button').filter(':has(svg.lucide-star), :has(svg)').eq(4).click({ force: true }); 
    
    cy.get('input[placeholder*="Excellent"], input[type="text"]').first().type('Amazing Course');
    cy.get('textarea').type('The instructor explained complex topics perfectly.');
    
    cy.contains(/submit review|submit/i).click();

    cy.contains(/success|submitted|thank/i, { timeout: 10000 }).should('be.visible');
  });
});