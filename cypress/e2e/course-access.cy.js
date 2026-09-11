describe('Teacher - Course Completion', () => {
  it('Locks a course syllabus and submits a final wrap-up note', () => {
    cy.viewport(1280, 720);
    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('tchr@example.com');
    cy.get('input[type="password"]').type('tchr123');
    cy.get('input[type="submit"]').click();

    cy.url().should('include', '/teacher');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    cy.contains('Course Management').click();
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
    
    // FIX: Target the first row of the table, and click its last button/link 
    // (This works perfectly for standard action columns, even if it's just an icon)
    cy.get('tbody tr').first().within(() => {
      cy.get('button, a').last().click();
    });
    
    // --- Paste the rest of your original test's completion/locking logic below this line ---
    
  });
});