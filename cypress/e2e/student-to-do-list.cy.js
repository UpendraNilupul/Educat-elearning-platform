describe('Student - To-Do List', () => {
  it('Adds a new personal task to the student calendar', () => {
    cy.viewport(1280, 720);

    cy.intercept('GET', '**/api/student/*').as('getStudentData');

    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('std@example.com');
    cy.get('input[type="password"]').type('std123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.url().should('include', '/student');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    // FIX: Navigate via sidebar to Calendar or To-Do / Planner
    cy.get('aside').contains(/calendar|todo|planner|tasks/i).click();

    cy.wait('@getStudentData', { timeout: 10000 });
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    // Safe calendar day or add task button selection
    cy.get('body').then(($body) => {
      if ($body.find('.react-calendar__tile').length > 0) {
        cy.get('.react-calendar__tile').eq(15).click({ force: true });
      } else {
        cy.contains(/add task|new task|create/i).click();
      }
    });

    cy.get('input[type="text"], input[placeholder*="Task"]').first().type('Complete Math Assignment');
    cy.contains(/save|add|submit/i).click();

    cy.contains(/success|complete|assignment/i, { timeout: 10000 }).should('be.visible');
  });
});