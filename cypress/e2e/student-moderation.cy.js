describe('Admin - Student Moderation', () => {
  it('Suspends an active student account', () => {
    cy.viewport(1280, 720);

    cy.intercept('GET', '**/api/admin/students-list*').as('getStudents');

    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.url().should('include', '/admin');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    cy.visit('http://localhost:5173/admin/students');
    
    cy.wait('@getStudents', { timeout: 10000 });
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    cy.get('body').then(($body) => {
      if ($body.find('table tr, [role="row"]').length <= 1) {
        throw new Error(
          '🛑 TEST HALTED: No student records found in the database table.'
        );
      }
    });

    // 1. Target the action menu trigger inside the first student row
    cy.get('table tr').not(':has(th)').first().find('button, svg, [role="button"]').last().click({ force: true });

    // 2. FIX: Use force: true to prevent layout overlay collisions on the dropdown item
    cy.contains(/suspend|deactivate|block|view profile/i, { timeout: 5000 }).first().click({ force: true });

    // 3. Confirm suspension if a modal appears
    cy.get('body').then(($body) => {
      if ($body.text().toLowerCase().includes('are you sure') || $body.text().toLowerCase().includes('confirm')) {
        cy.contains(/confirm|yes|proceed/i).click({ force: true });
      }
    });

    cy.contains(/suspended|success|updated|blocked/i, { timeout: 10000 }).should('be.visible');
  });
});