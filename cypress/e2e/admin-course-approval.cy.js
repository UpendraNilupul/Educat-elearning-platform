describe('Admin - Course Approval', () => {
  it('Approves a pending course and publishes it to the platform', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('input[type="submit"]').click();

    cy.url().should('include', '/admin');
    cy.contains('Overview Dashboard').should('be.visible');

    cy.get('nav a[href="/admin/courses"]').click();
    
    cy.get('select').select('not_active');
    
    // Fix 1: Force Cypress to wait until the API fetch completes and the loading text disappears
    cy.contains('Loading courses...', { timeout: 10000 }).should('not.exist');

    // Fix 2: Use a bulletproof selector to click the action menu of the first row
    cy.get('tbody button').first().click();
    
    cy.contains('Approve & Publish').click();
    cy.on('window:confirm', () => true);
    
    cy.get('span').contains('active').should('be.visible');
  });
});