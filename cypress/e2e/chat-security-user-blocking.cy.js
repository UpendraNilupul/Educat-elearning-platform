describe('Chat Security - User Blocking', () => {
  it('Blocks a user and disables the message input field', () => {
    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('ACTUAL_STUDENT_EMAIL@example.com');
    cy.get('input[type="password"]').type('ACTUAL_PASSWORD');
    cy.get('input[type="submit"]').click();

    cy.url().should('include', '/student');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    cy.contains('Messages').click();
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
    
    // Open an active conversation
    cy.get('.group').first().click();
    
    // FIX 1: Use a broader selector that catches either an input or textarea
    // with a placeholder that contains the word "message" (case-insensitive)
    cy.get('input[placeholder*="message" i], textarea[placeholder*="message" i]', { timeout: 10000 })
      .should('be.visible')
      .as('messageBox'); // Alias this element so we can reuse it cleanly

    // FIX 2: Trigger the block action
    cy.get('button').filter(':has(.lucide-ban)').first().click(); 
    cy.contains('Block User').click();
    cy.on('window:confirm', () => true);

    // Verify the input field is disabled using the alias
    cy.get('@messageBox').should('be.disabled');
  });
});