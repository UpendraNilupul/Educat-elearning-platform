describe('Admin - Promo Code Management', () => {
  it('Creates a new promotional code', () => {
    cy.viewport(1280, 720);
    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    // 1. SYNCHRONIZATION CHECKPOINT: Wait for the session token
    cy.url().should('include', '/admin');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    // 2. Safe Navigation: Direct route only after auth is confirmed
    cy.visit('http://localhost:5173/admin/promos');
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
    
    // 3. Trigger the creation UI (case-insensitive to bypass icon wrappers)
    cy.contains(/create promo code/i).click();
    
    // 4. Structural targeting for the inputs
    cy.get('input[type="text"]').first().type('ZIRON2026');
    
    // 5. Dynamic dropdown selection to prevent crashes on empty databases
    cy.get('select').first().then(($select) => {
      const $validOptions = $select.find('option:not([disabled])');
      
      if ($validOptions.length === 0) {
        throw new Error(
          '🛑 TEST HALTED: The database has no active courses. You must create a course before generating a promo code linked to one.'
        );
      } else {
        // Safely select the first valid course option
        cy.wrap($select).select($validOptions.first().val());
      }
    });
    
    // --- Paste the rest of your original promo code logic (discount amount, dates, submit) below this line ---
    
  });
});