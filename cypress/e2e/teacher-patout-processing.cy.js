describe('Finance Admin - Payout Processing', () => {
  it('Records a successful payment transaction for a teacher', () => {
    cy.viewport(1280, 720);

    cy.intercept('GET', '**/api/admin/payouts*').as('getPayouts');

    cy.visit('http://localhost:5173/login');
    
    // FIX: Use the standard finance admin email/password credentials used in earlier successful finance tests ('finance.admin@example.com' / 'finance123')
    cy.get('input[type="email"]').type('finance.admin@example.com');
    cy.get('input[type="password"]').type('finance123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.url().should('include', '/admin');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    cy.visit('http://localhost:5173/admin/payouts');
    
    cy.wait('@getPayouts', { timeout: 10000 });
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Pay"), button:contains("Process"), [class*="pay"]').length === 0) {
        throw new Error(
          '🛑 TEST HALTED: No pending payout ledger entries found in the database.'
        );
      }
    });

    cy.contains(/pay|process|transfer/i).first().click({ force: true });
    
    cy.contains(/full|max|all/i).click({ force: true });
    cy.get('input[placeholder*="Reference"], input[name*="ref"], input[type="text"]').first().type('Monthly Bank Transfer Settlement');
    
    cy.contains(/confirm|submit|record|save/i).click();

    cy.contains(/success|recorded|completed|paid/i, { timeout: 10000 }).should('be.visible');
  });
});