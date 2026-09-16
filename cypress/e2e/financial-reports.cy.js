describe('Admin - Financial Reports', () => {
  it('Generates and downloads a revenue CSV report', () => {
    // Force desktop viewport so the sidebar renders
    cy.viewport(1280, 720);
    
    cy.visit('http://localhost:5173/login');
    
    // Ensure these match a real Admin in your MySQL database
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('input[type="submit"]').click();

    // 1. Synchronization Checkpoint: Wait for backend auth to finish
    cy.url().should('include', '/admin');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    // 2. Safe sidebar navigation targeting the routing href directly
    cy.get('a[href="/admin/payouts"]').click();
    
    // 3. Wait for the payouts table/page to load
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
    
    // 4. Trigger the report generation UI
    cy.contains('Generate Reports').click();
    
    // 5. Select Revenue Report and This Month
    cy.get('select').eq(0).select('revenue');
    
    // --- Paste the rest of your original report generation logic below this line ---
    
  });
});