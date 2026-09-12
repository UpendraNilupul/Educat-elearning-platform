describe('Admin - Chat Access Approvals', () => {
  it('Approves a pending student chat request', () => {
    cy.visit('http://localhost:5173/login');
    
    // IMPORTANT: Ensure these match a real Admin in your MySQL database
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('input[type="submit"]').click();

    // 1. Synchronization Checkpoint: Wait for backend auth to finish
    cy.url().should('include', '/admin');
    cy.contains('Overview Dashboard').should('be.visible');

    // 2. Safe sidebar navigation
    cy.get('nav a[href="/admin/communications"]').click();
    
    // Wait for the page/table to load
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
    
    // 3. Switch to the Chat Requests tab
    cy.contains('Chat Requests').click();
    
    // 4. Approve the first pending request
    cy.contains('Approve').first().click();
    
    // Verify success if your app shows an alert or status change
    cy.on('window:alert', (str) => {
      expect(str.toLowerCase()).to.include('success');
    });
  });
});