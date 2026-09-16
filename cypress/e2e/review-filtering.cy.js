describe('Teacher - Review Filtering', () => {
  Cypress.on('uncaught:exception', () => false);

  it('Filters the feedback list by a specific course', () => {
    cy.viewport(1280, 720);

    cy.intercept('POST', '**/api/login').as('loginRequest');

    // Broad wildcard intercept for reviews to match any teacher ID
    cy.intercept('GET', '**/api/teachers/*/reviews*', {
      statusCode: 200,
      body: {
        success: true,
        reviews: [
          {
            id: 1,
            student_name: 'Alice Smith',
            course_name: 'Advanced Mathematics',
            rating: 5,
            title: 'Great Class!',
            description: 'Learned a lot.',
            is_read: 1
          },
          {
            id: 2,
            student_name: 'Bob Jones',
            course_name: 'Physics 101',
            rating: 4,
            title: 'Very Helpful',
            description: 'Clear explanations.',
            is_read: 1
          }
        ]
      }
    }).as('getReviews');

    // Login Flow
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('tchr@example.com');
    cy.get('input[type="password"]').type('tchr123');
    cy.get('input[type="submit"], button[type="submit"]').click();

    cy.wait('@loginRequest', { timeout: 10000 });
    cy.url().should('include', '/teacher');

    // Navigate to Reviews / Feedback view via Sidebar
    cy.get('aside', { timeout: 10000 }).contains(/reviews|feedback|ratings/i).click();
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    // Verify initial render using Review Titles (these only exist inside the review cards)
    cy.contains('Great Class!', { timeout: 10000 }).should('be.visible');
    cy.contains('Very Helpful').should('be.visible');

    // FIX 1: Verify the course names specifically inside paragraph tags to ignore the <option> dropdown
    cy.contains('p', 'Advanced Mathematics').should('be.visible');
    cy.contains('p', 'Physics 101').should('be.visible');

    // Select a specific course from the filter dropdown
    cy.get('select', { timeout: 10000 }).select('Advanced Mathematics');

    // FIX 2: Verify the excluded review's title disappears completely
    cy.contains('Great Class!').should('be.visible');
    cy.contains('Very Helpful').should('not.exist');
    
    // FIX 3: Confirm the Physics 101 paragraph is gone (the <option> tag still exists, which is correct)
    cy.contains('p', 'Physics 101').should('not.exist');
  });
});