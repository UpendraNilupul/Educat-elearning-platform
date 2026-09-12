describe('Teacher - Resource Management', () => {
  it('Adds an external link resource to a lesson', () => {
    cy.viewport(1280, 720);

    cy.intercept('GET', '**/api/courses*').as('getCourses');

    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('tchr@example.com');
    cy.get('input[type="password"]').type('tchr123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.url().should('include', '/teacher');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    cy.get('aside').contains(/course management|classes|materials/i).click();

    cy.wait('@getCourses', { timeout: 10000 });
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    cy.get('body').then(($body) => {
      if ($body.find(':contains("View")').length === 0) {
        throw new Error(
          '🛑 TEST HALTED: The teacher (tchr@example.com) has no active courses or view links in the database. Create a course first.'
        );
      }
    });

    cy.contains(/view|manage/i).first().click();

    cy.contains(/module|lesson|content/i).first().click();
    cy.contains(/add resource|upload|external link/i).click();

    cy.get('input[type="text"]').first().type('Reference Material Link');
    cy.get('input[type="url"], input[type="text"]').last().type('https://example.com/resource');

    cy.contains(/save|upload|submit/i).click();

    cy.contains(/success|added|saved/i, { timeout: 10000 }).should('be.visible');
  });
});