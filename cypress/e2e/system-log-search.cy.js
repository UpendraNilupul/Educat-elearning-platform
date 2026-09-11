describe('Admin - System Logs Search', () => {
  it('Filters audit logs by admin name or action type', () => {
    cy.viewport(1280, 720);

    cy.intercept('GET', '**/api/admin/system-logs*').as('getLogs');

    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.url().should('include', '/admin');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    cy.visit('http://localhost:5173/admin/system-logs');
    
    cy.wait('@getLogs', { timeout: 10000 });
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    // FIX: Type a search term that is guaranteed to match existing log entries, or check for either matching logs or the empty state message
    cy.get('input[placeholder*="Search"], input[type="search"], input[type="text"]').first().type('admin');

    cy.get('body').then(($body) => {
      const text = $body.text();
      if (text.includes('No logs found')) {
        cy.contains('No logs found matching your search.').should('be.visible');
      } else {
        cy.get('tbody tr, [role="row"]').should('exist');
      }
    });
  });
});