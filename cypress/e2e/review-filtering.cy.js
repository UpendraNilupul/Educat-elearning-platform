describe('Teacher - Review Filtering', () => {
  it('Filters the feedback list by a specific course', () => {
    cy.viewport(1280, 720);

    cy.intercept('GET', '**/api/teacher/reviews*').as('getReviews');
    cy.intercept('GET', '**/api/courses*').as('getCourses');

    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('tchr@example.com');
    cy.get('input[type="password"]').type('tchr123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.url().should('include', '/teacher');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    cy.get('aside').contains(/reviews|feedback|ratings/i).click();

    cy.wait('@getReviews', { timeout: 10000 });
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    cy.get('select').then(($select) => {
      const $options = $select.find('option:not([disabled])');
      if ($options.length <= 1) {
        throw new Error(
          '🛑 TEST HALTED: The teacher has fewer than two options in the course filter dropdown. Ensure multiple courses exist with reviews.'
        );
      }
      cy.wrap($select).select($options.eq(1).val());
    });

    cy.wait('@getReviews', { timeout: 10000 });
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
  });
});