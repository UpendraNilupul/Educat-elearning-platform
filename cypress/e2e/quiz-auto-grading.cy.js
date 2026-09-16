describe('EduCat E2E - Quiz Player & Auto-Grading', () => {
  // Prevent React background crashes from halting the test
  Cypress.on('uncaught:exception', () => false);

  it('Allows a student to start an active quiz, answer questions, and submit for instant grading', () => {
    cy.viewport(1280, 720);

    cy.intercept('POST', '**/api/login').as('loginRequest');

    // FIX 1: Dynamically calculate a recent publish date so it isn't locked AND isn't expired
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();

    cy.intercept('GET', '**/student/my-assessments*', {
      statusCode: 200,
      body: [
        {
          id: 1,
          course_id: 101,
          title: 'Cypress Automation Quiz',
          subject: 'Software Quality Assurance',
          status: 'pending',
          type: 'Quiz', 
          publish_at: fiveMinutesAgo, // Just published
          time_limit: '24:00:00' // Expires 24 hours from publish_at
        }
      ]
    }).as('getAssessments');

    // Mock the Quiz Initialization Endpoint
    cy.intercept('POST', '**/quizzes/*/start*', {
      statusCode: 200,
      body: {
        id: 1,
        title: 'Cypress Automation Quiz',
        time_limit: '24:00:00',
        savedState: { currentQuestionIdx: 0, studentAnswers: {} },
        questions: [
          {
            id: 1,
            question: 'What is Cypress?',
            type: 'multiple', // Based on your frontend checking qType === 'multiple'
            marks: 10,
            options: [
              { id: 101, answer: 'Testing Tool' },
              { id: 102, answer: 'Web Browser' },
              { id: 103, answer: 'Database' }
            ]
          }
        ]
      }
    }).as('startQuiz');

    // Intercept the auto-save intervals to prevent unhandled background rejections
    cy.intercept('PUT', '**/quizzes/*/progress*', {
      statusCode: 200,
      body: { success: true }
    }).as('saveProgress');

    // Intercept the final submission
    cy.intercept('POST', '**/quizzes/*/submit*', {
      statusCode: 200,
      body: { success: true, score: 100, message: 'Quiz submitted successfully' }
    }).as('submitQuiz');

    // 1. Login Flow
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('std@example.com');
    cy.get('input[type="password"]').type('std123');
    cy.get('input[type="submit"], button[type="submit"]').click();

    cy.wait('@loginRequest', { timeout: 10000 });
    cy.url().should('include', '/student');

    // 2. Navigate to Assessments
    cy.visit('http://localhost:5173/assessments');
    cy.wait('@getAssessments', { timeout: 10000 });

    // 3. Start the Quiz
    cy.contains('button', 'Start Quiz', { timeout: 10000 }).click({ force: true });
    cy.wait('@startQuiz', { timeout: 10000 });

    // 4. Answer the specific mocked question
    // Your frontend renders <button> tags with the option text for answers
    cy.contains('button', 'Testing Tool', { timeout: 10000 }).click({ force: true });

    // 5. Submit the Quiz
    cy.contains('button', 'Submit Quiz').click({ force: true });
    cy.wait('@submitQuiz', { timeout: 10000 });

    // 6. Verify the Completion Screen Renders
    cy.contains('Quiz Completed!', { timeout: 10000 }).should('be.visible');
    cy.contains('100').should('be.visible');
  });
});