describe('Admin - Chat Access Approvals', () => {
  it('Approves a pending student chat request', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('input[type="submit"]').click();

    cy.visit('http://localhost:5173/admin/communications');
    cy.contains('Chat Requests').click();
    
    // Approve the first pending request
    cy.contains('Approve').first().click();
    
    // Verify it moves to the approved status
    cy.contains('approved').should('be.visible');
  });
});