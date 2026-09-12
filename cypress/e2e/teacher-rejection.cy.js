describe('Admin - Teacher Rejection', () => {
  it('Rejects a pending teacher application with mandatory feedback', () => {
    cy.viewport(1280, 720);

    cy.intercept('GET', '**/api/admin/teachers-list*').as('getTeachersList');
    cy.intercept('GET', '**/api/admin/teacher-details/*').as('getTeacherDetails');
    cy.intercept('PUT', '**/api/admin/verify-teacher/*').as('verifyTeacher');

    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.url().should('include', '/admin');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    cy.visit('http://localhost:5173/admin/teachers');

    cy.wait('@getTeachersList', { timeout: 10000 });
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    // FIX: Specifically target a row that is in "pending" status so the feedback form is rendered
    cy.get('tbody tr, [role="row"]').contains(/pending/i).parents('tr, [role="row"]').first().within(() => {
      cy.get('button, [role="button"]').last().click({ force: true });
    });

    cy.contains(/review application/i).click({ force: true });

    cy.wait('@getTeacherDetails', { timeout: 10000 });
    cy.url().should('include', '/admin/review-teacher/');
    
    cy.get('textarea', { timeout: 10000 })
      .should('be.visible')
      .clear({ force: true })
      .type('Incomplete qualification documentation provided.', { force: true });
    
    cy.contains('Reject Application').click({ force: true });

    cy.wait('@verifyTeacher', { timeout: 10000 }).its('response.statusCode').should('eq', 200);
  });
});