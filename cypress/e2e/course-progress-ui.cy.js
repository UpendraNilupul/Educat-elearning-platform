describe('Student - Course Progress UI', () => {
  it('Verifies the course progress bar is visible on active enrollments', () => {
    cy.viewport(1280, 720);
    cy.visit('http://localhost:5173/login');
    
    // WARNING: This user MUST be enrolled in at least one course in your database!
    cy.get('input[type="email"]').type('std@example.com');
    cy.get('input[type="password"]').type('std123');
    cy.get('input[type="submit"]').click();

    cy.url().should('include', '/student');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    // 1. Navigate to the main courses area
    cy.contains('Courses').click();
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
    
    // 2. FIX: Navigate to the specific tab/area that actually shows progress.
    // If your sidebar has a "My Learning" or "Enrolled" button, update the text below:
    cy.contains('My Classes').click(); // CHANGE THIS TEXT to match your UI
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    // 3. Fallback check: Ensure the screen doesn't say "No courses found"
    cy.get('body').then(($body) => {
      if ($body.text().includes('No courses')) {
        throw new Error('Test Failed: std@example.com has 0 enrollments in the database. Please enroll them manually first.');
      }
    });

    // 4. Verify progress indicators
    cy.contains('%').should('be.visible');
    cy.contains('Completed').should('be.visible');
  });
});