describe('Admin - Password Reset Validation', () => {
  it('Prevents password update if confirmation does not match', () => {
    cy.viewport(1280, 720);
    cy.visit('http://localhost:5173/login');
    
    // Ensure these match a real Admin in your MySQL database
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    // 1. SYNCHRONIZATION CHECKPOINT: Wait for backend auth to finish
    cy.url().should('include', '/admin');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    // 2. Safe Navigation: Only visit settings after auth is confirmed
    cy.visit('http://localhost:5173/admin/settings');
    
    // Wait for the settings page to fully render
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
    
    // 3. Fill out the password fields
    cy.get('input[name="currentPassword"]').type('admin123');
    cy.get('input[name="newPassword"]').type('newsecurepass');
    cy.get('input[name="confirmPassword"]').type('mismatchpass');
    
    // Target the specific submit button for the password update form
    cy.get('button[type="submit"], input[type="submit"]').last().click();
    
    // 4. Verify the validation error is caught by the UI
    // Adjust this regex if your specific error message differs (e.g., "Passwords must match")
    cy.contains(/match/i).should('be.visible');
  });
});