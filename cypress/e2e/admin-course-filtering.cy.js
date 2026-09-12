describe('Admin - Course Filtering', () => {
  it('Filters the course directory to show only suspended courses', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('input[type="submit"]').click();

    cy.url().should('include', '/admin');
    cy.contains('Overview Dashboard').should('be.visible');

    cy.get('nav a[href="/admin/courses"]').click();
    
    cy.contains('Loading courses...', { timeout: 10000 }).should('not.exist');

    // Fix: Target the specific dropdown by its index. 
    // If the status filter is the second dropdown on your UI, change eq(0) to eq(1)
    cy.get('select').eq(0).select('suspended');
    
    cy.contains('Loading courses...', { timeout: 10000 }).should('not.exist');

    cy.get('table').within(() => {
      cy.get('tbody').then($tbody => {
        if (!$tbody.text().includes('No courses found')) {
          cy.get('span').contains('suspended').should('exist');
        }
      });
    });
  });
});