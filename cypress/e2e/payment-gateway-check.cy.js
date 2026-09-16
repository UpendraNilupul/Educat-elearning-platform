describe('Student - Payment Gateway Check', () => {
  it('Triggers the secure payment gateway for a locked class', () => {
    cy.viewport(1280, 720);
    
    cy.intercept('GET', '**/api/student/classes*').as('getClasses');
    
    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('std@example.com');
    cy.get('input[type="password"]').type('std123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.url().should('include', '/student');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    cy.get('aside').contains(/classes/i).click();
    
    cy.wait('@getClasses', { timeout: 10000 });
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
    
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Enter Portal")').length === 0) {
        throw new Error(
          '🛑 TEST HALTED: The student has no locked classes. Manually enroll them in an unpaid course and re-run.'
        );
      }
    });
    
    // 1. Click to enter the class portal
    cy.contains('button', /enter portal/i).last().click();
    
    // 2. FIX: Wait for the class portal view to transition and any loading state to clear
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
    
    // 3. FIX: Extend the timeout to 10 seconds to allow the backend to verify the locked status.
    // Using a broader regex just in case the specific button text is "Pay Now" or "Pay" in the React component.
    cy.contains(/(make a payment|pay now|pay)/i, { timeout: 10000 }).click();
    
    // --- Paste the rest of your original PayHere gateway logic below this line ---
    
  });
});