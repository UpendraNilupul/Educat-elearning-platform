describe('Admin - Promo Code Toggle', () => {
  it('Deactivates an active promo code', () => {
    cy.viewport(1280, 720);
    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    // 1. SYNCHRONIZATION CHECKPOINT: Wait for backend auth to finish
    cy.url().should('include', '/admin');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    // 2. Safe Navigation: Only visit promos after auth is confirmed
    cy.visit('http://localhost:5173/admin/promos');
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
    
    // 3. Database State Safeguard: Ensure a promo code exists to toggle
    cy.get('body').then(($body) => {
      if ($body.find(':contains("Deactivate")').length === 0) {
        throw new Error(
          '🛑 TEST HALTED: No active promo codes found in the database. Create a promo code first before running the toggle test.'
        );
      }
    });

    // 4. Find the first active code and deactivate it
    cy.contains(/deactivate/i).first().click();
    
    // 5. The button text should change to Reactivate
    cy.contains(/reactivate/i, { timeout: 10000 }).should('exist');
  });
});