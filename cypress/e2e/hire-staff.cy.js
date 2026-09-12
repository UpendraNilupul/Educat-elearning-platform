describe('Super Admin - Team Expansion', () => {
  it('Creates a new Financial Manager sub-admin account', () => {
    cy.viewport(1280, 720);
    cy.visit('http://localhost:5173/login');
    
    // Ensure these credentials exist in your local database
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    // 1. SYNCHRONIZATION CHECKPOINT: Wait for the token to save
    cy.url().should('include', '/admin');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    // 2. Direct Navigation to bypass sidebar complexities
    cy.visit('http://localhost:5173/admin/team');
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    // 3. Flexible text matching (ignores SVG icons and exact capitalization)
    cy.contains(/hire staff/i).click();

    // 4. Fill the form using structural attribute selectors
    // Using { force: true } on the radio button in case Tailwind hides the native input
    cy.get('input[value="finance"]').click({ force: true }); 
    cy.get('input[name="name"]').type('Finance Tester');
    
    // Assuming standard email/password inputs based on your original snippet
    // Using .last() to ensure we target the modal's inputs, not the background sidebar
    cy.get('input[type="email"]').last().type('finance.test@example.com');
    cy.get('input[type="password"]').last().type('Finance123!');

    // 5. Submit the modal form safely
    cy.get('form').last().within(() => {
      cy.get('button[type="submit"], input[type="submit"]').click();
    });
  });
});