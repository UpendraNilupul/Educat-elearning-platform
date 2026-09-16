describe('Student - Course Review', () => {
  Cypress.on('uncaught:exception', () => false);

  it('Submits a rating and written feedback for a completed class', () => {
    cy.viewport(1280, 720);

    cy.intercept('POST', '**/api/login').as('loginRequest');

    // 1. Mock student classes with a completed course
    cy.intercept('GET', '**/api/student/classes*', {
      statusCode: 200,
      body: [
        {
          id: 42,
          grade: 'Grade 12',
          subject: 'Advanced Mathematics',
          status: 'completed',
          progress: 100,
          thumbnail_url: null,
          teacher: {
            name: 'Dr. John Doe',
            image: 'https://ui-avatars.com/api/?name=Dr.+John+Doe'
          },
          monthlyFee: 2500,
          months: []
        }
      ]
    }).as('getStudentClasses');

    // Mock review submission endpoint
    cy.intercept('POST', '**/api/reviews', {
      statusCode: 200,
      body: { success: true, message: 'Review added successfully' }
    }).as('submitReview');

    // 2. Login Flow
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('std@example.com');
    cy.get('input[type="password"]').type('std123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.wait('@loginRequest', { timeout: 10000 });
    cy.url().should('include', '/student');

    // 3. Navigate to Courses via Sidebar
    cy.get('aside', { timeout: 10000 }).contains(/classes|lessons|courses/i).click();
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    cy.contains(/completed/i, { timeout: 10000 }).click({ force: true });

    // 4. Click "Review Course" directly on the completed course card
    cy.contains('Advanced Mathematics', { timeout: 10000 })
      .parents('div.bg-white, div.group')
      .first()
      .within(() => {
        cy.contains('button', /review course|review|rate/i).click({ force: true });
      });

    // 5. Fill out rating and feedback in the form/modal
    cy.get('textarea, input[type="text"]', { timeout: 10000 }).first().type('Fantastic course with clear explanations.');

    // Click rating stars if present
    cy.get('svg, button').then(($els) => {
      const stars = Array.from($els).filter(el => el.outerHTML.toLowerCase().includes('star'));
      if (stars.length > 0) {
        cy.wrap(stars[stars.length - 1]).click({ force: true });
      }
    });

    // Submit feedback
    cy.contains('button', /submit|post|save|record|send/i).last().click({ force: true });

    // 6. Verify submission success
    cy.wait('@submitReview', { timeout: 10000 });
  });
});