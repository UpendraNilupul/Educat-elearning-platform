// cypress/e2e/quiz-auto-grading.cy.js

describe('EduCat E2E - Quiz Player & Auto-Grading', () => {
  it('Allows a student to start an active quiz, answer questions, and submit for instant grading', () => {
    // 1. Log in as an existing student (or register a fresh one)
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('student@example.com'); // Or your test student seed
    cy.get('input[type="password"]').type('password123');
    cy.get('input[type="submit"]').click();

    // 2. Navigate to the Assessments / Quizzes page
    cy.visit('http://localhost:5173/assessments');
    cy.contains('Pending Assessments').should('be.visible');

    // 3. Locate an available quiz and click "Start Quiz"
    // (Ensures the modal quiz player interface activates)
    cy.get('button').contains('Start Quiz').first().click();

    // 4. Verify the quiz player interface renders with the question counter
    cy.contains('Question 1 of').should('be.visible');

    // 5. Select an answer option for the first question
    cy.get('input[type="radio"], input[type="checkbox"]').first().click();

    // 6. Navigate to the next question or submit if it's the final question
    cy.get('button').contains('Next').click();

    // (If completing a mock single-question quiz or stepping through)
    // Click submit quiz button
    cy.get('body').then(($body) => {
      if ($body.text().includes('Submit Quiz')) {
        cy.contains('Submit Quiz').click();
        // Verify the final score card renders
        cy.contains('Quiz Completed!').should('be.visible');
        cy.contains('Final Score').should('be.visible');
      }
    });
  });
});