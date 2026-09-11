describe('EduCat E2E - Teacher Course and Assessment Creation', () => {
  it('Logs in as an approved teacher, creates a course module, and adds an assignment', () => {
    // 1. Force desktop viewport to prevent the sidebar from hiding
    cy.viewport(1280, 720);
    
    cy.visit('http://localhost:5173/login');
    
    // 2. Use your real database credentials
    cy.get('input[type="email"]').type('tchr@example.com');
    cy.get('input[type="password"]').type('tchr123');
    cy.get('input[type="submit"]').click();

    // 3. Synchronization Checkpoint (Replaces the broken cy.visit)
    cy.url().should('include', '/teacher');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    // 4. Safe navigation using the sidebar
    cy.contains('Course Management').click();
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    // 5. Create a new course
    cy.contains('Create New Course').click();
    
    // --- Paste the rest of your original course creation logic below this line ---
    
  });
});