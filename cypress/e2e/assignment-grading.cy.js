describe('Teacher - Assignment Grading', () => {
  it('Grades a pending student submission', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('tchr@example.com');
    cy.get('input[type="password"]').type('tchr123');
    cy.get('input[type="submit"]').click();

    // 1. Synchronization Checkpoint: Wait for backend auth to finish
    cy.url().should('include', '/teacher');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    // 2. Safe sidebar navigation
    cy.contains('Assessments').click();
    
    // 3. Wait for data to load
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
    
    // 4. Navigate to submissions for the first assignment
    cy.contains('Manage Assessments').first().click();
    
    // Wait for the specific assignment management screen to render
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
    cy.contains('View Submissions').first().click();

    // 5. Click the first ungraded student submission
    // (Test will fail here if there are 0 student submissions in your database)
    cy.contains('submitted').first().click();
    
    // 6. Enter grade and feedback
    cy.get('input[type="number"]').type('85');
    cy.get('textarea').type('Great work, excellent attention to detail.');
    cy.contains('Submit Grade').click();

    // 7. Verify success alert
    cy.on('window:alert', (str) => {
       expect(str.toLowerCase()).to.include('grade submitted');
    });
  });
});