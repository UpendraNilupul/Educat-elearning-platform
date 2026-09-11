describe('Admin - Advertisement Management', () => {
  it('Publishes a pending teacher advertisement to the platform', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('input[type="submit"]').click();

    // 1. Synchronization Checkpoint: Wait for backend auth to finish
    cy.url().should('include', '/admin');
    cy.contains('Overview Dashboard').should('be.visible');

    // 2. Safe sidebar navigation instead of cy.visit()
    cy.get('nav a[href="/admin/advertisements"]').click();
    
    // 3. Wait for the data table/UI to finish loading
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    cy.contains('Teacher Uploads').click();
    
    // 4. Find the first pending ad and publish it
    // Using .parent() chaining as a safer alternative to strict CSS classes
    cy.contains('Pending').first().parent().parent().within(() => {
      cy.contains('Publish').click();
    });

    cy.contains('Published').should('be.visible');
  });
});