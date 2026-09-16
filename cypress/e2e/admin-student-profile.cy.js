describe('Admin - Student Profile Navigation', () => {
  it('Opens the detailed profile of a student from the directory', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('input[type="submit"]').click();

    // 1. Synchronization Checkpoint
    cy.url().should('include', '/admin');
    cy.contains('Overview Dashboard').should('be.visible');

    // 2. Safe sidebar navigation
    cy.get('nav a[href="/admin/students"]').click();
    
    // 3. Wait for the data table to load
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
    
    // 4. Robust selector: Click the first button in the table body
    cy.get('tbody button').first().click();
    
    // 5. Navigate to the profile
    cy.contains('View Profile').click();
    
    // 6. Verify successful navigation
    cy.url().should('include', '/admin/student-profile/');
    cy.contains('Course Enrollments').should('be.visible');
  });
});