describe('Teacher - Profile Update', () => {
  it('Updates teacher biography and qualifications', () => {
    cy.viewport(1280, 720);

    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('tchr@example.com');
    cy.get('input[type="password"]').type('tchr123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.url().should('include', '/teacher');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    cy.visit('http://localhost:5173/teacher/profile');

    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    // FIX: Directly target input fields and textareas if they are already editable, or click edit if present
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Edit"), [class*="edit"]').length > 0) {
        cy.get('button:contains("Edit"), [class*="edit"]').first().click({ force: true });
      }
    });

    cy.get('input[name="highest_qualification"], input[placeholder*="Qualification"], input[type="text"]').first().clear().type('PhD in Software Engineering');
    cy.get('textarea[name="bio"], textarea[placeholder*="Bio"], textarea').first().clear().type('Passionate about teaching modern web frameworks.');

    cy.contains(/save|update|submit/i).click();

    cy.contains(/success|updated|saved/i, { timeout: 10000 }).should('be.visible');
  });
});