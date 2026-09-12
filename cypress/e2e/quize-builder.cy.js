describe('Teacher - Quiz Builder', () => {
  it('Creates a quiz, adds a question, and sets the correct answer', () => {
    cy.viewport(1280, 720);
    
    cy.intercept('GET', '**/api/courses*').as('getCourses');

    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('tchr@example.com');
    cy.get('input[type="password"]').type('tchr123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    // 1. SYNCHRONIZATION CHECKPOINT: Wait for token and dashboard
    cy.url().should('include', '/teacher');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    // 2. Safe Navigation via sidebar to Course Management / Assessments
    cy.get('aside').contains(/course management|assessments|classes/i).click();
    
    cy.wait('@getCourses', { timeout: 10000 });
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    cy.get('body').then(($body) => {
      if ($body.find(':contains("View")').length === 0 && $body.find(':contains("Quiz")').length === 0) {
        throw new Error(
          '🛑 TEST HALTED: The teacher (tchr@example.com) has no active courses or view links in the database. Create a course first.'
        );
      }
    });

    // 3. Navigate into the course or quiz section safely
    cy.contains(/view|manage/i).first().click();
    
    cy.contains(/quiz|assessment/i).click();
    cy.contains(/create quiz|add quiz/i).click();

    // 4. Quiz metadata entry
    cy.get('input[type="text"]').first().type('Automated E2E Test Quiz');
    cy.contains(/save|next|add question/i).click();

    // 5. Add a question
    cy.get('textarea, input[type="text"]').first().type('What is the capital of Sri Lanka?');
    
    // Fill options
    cy.get('input[type="text"]').eq(1).type('Colombo');
    cy.get('input[type="text"]').eq(2).type('Kandy');

    // Select correct answer (radio or checkbox)
    cy.get('input[type="radio"], input[type="checkbox"]').first().check({ force: true });

    cy.contains(/save question|submit|finish/i).click();
  });
});