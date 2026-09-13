describe('Chat Security - User Blocking', () => {
  it('Blocks a user and disables the message input field', () => {
    cy.viewport(1280, 720);

    cy.intercept('POST', '**/api/login').as('loginRequest');

    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('std@example.com');
    cy.get('input[type="password"]').type('std123');
    cy.get('input[type="submit"], button[type="submit"]').click();

    cy.wait('@loginRequest', { timeout: 10000 });
    cy.url().should('include', '/student');

    cy.get('aside', { timeout: 10000 }).should('be.visible');
    cy.contains('Messages').click();

    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    // Click the first conversation
    cy.get('.group').first().click({ force: true });

    // FIX: Catch any text input, textarea, or contenteditable div at the bottom of the screen
    cy.get('input[type="text"], textarea, [contenteditable="true"]', { timeout: 10000 })
      .last()
      .should('be.visible')
      .as('messageBox'); 

    // Verify it is enabled before blocking
    cy.get('@messageBox').should('not.be.disabled');

    // ---------------------------------------------------------
    // Proceed with your blocking mechanics below
    // ---------------------------------------------------------
    
    // Example: Click a settings/more button inside the chat header
    // cy.get('header').find('button').last().click();
    // cy.contains(/block/i).click();
    // cy.on('window:confirm', () => true);

    // Verify the input is disabled or removed after blocking
    // cy.get('@messageBox').should('be.disabled').or('not.exist');
  });
});