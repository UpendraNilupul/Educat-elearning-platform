describe('EduCat E2E - Quiz Player & Auto-Grading', () => {
  it('Allows a student to start an active quiz, answer questions, and submit for instant grading', () => {
    cy.viewport(1280, 720);

    cy.intercept('GET', '**/api/student/my-assessments*').as('getAssessments');

    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('std@example.com');
    cy.get('input[type="password"]').type('std123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.url().should('include', '/student');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    cy.visit('http://localhost:5173/assessments');
    
    cy.wait('@getAssessments', { timeout: 10000 });
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Start Quiz")').length === 0) {
        throw new Error(
          '🛑 TEST HALTED: The student (student@example.com) has no active pending quizzes assigned in the database. Create a published quiz/assessment for this student first.'
        );
      }
    });

    cy.contains('button', /start quiz/i).first().click();

    cy.contains(/question 1 of/i, { timeout: 10000 }).should('be.visible');

    cy.get('input[type="radio"], label').first().click();
    cy.contains(/next|submit/i).click();

    cy.get('body').then(($body) => {
      if ($body.text().toLowerCase().includes('next')) {
        cy.contains(/next|submit/i).click();
      }
    });

    cy.contains(/submit quiz|finish|complete/i).click();

    cy.contains(/score|grade|result|passed|failed/i, { timeout: 10000 }).should('be.visible');
  });
});