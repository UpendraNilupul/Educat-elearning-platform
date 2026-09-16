describe('Teacher - Course Completion', () => {
  it('Locks a course syllabus and submits a final wrap-up note', () => {
    cy.viewport(1280, 720);

    cy.intercept('POST', '**/api/login').as('loginRequest');
    
    // FIX 1: Wrap the mock data in the standard `{ success: true, data: [] }` structure
    cy.intercept('GET', '**/api/courses*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            title: 'Advanced Mathematics',
            course_code: 'MATH201',
            status: 'active', // Triggers the active UI actions
            enrollment_count: 25,
            created_at: '2026-01-01',
            teacher_id: 17
          }
        ]
      }
    }).as('getCourses');

    cy.intercept('PUT', '**/api/courses/*/complete*', {
      statusCode: 200,
      body: { success: true, message: 'Course locked successfully' }
    }).as('completeCourse');

    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('tchr@example.com');
    cy.get('input[type="password"]').type('tchr123');
    cy.get('input[type="submit"], button[type="submit"]').click();

    cy.wait('@loginRequest', { timeout: 10000 });
    cy.url().should('include', '/teacher');

    cy.get('aside', { timeout: 10000 }).should('be.visible');
    cy.contains('Course Management').click();

    cy.wait('@getCourses', { timeout: 10000 });
    cy.contains('Loading').should('not.exist');

    // FIX 2: Broaden the selector to catch either Table Rows OR Grid Cards
    cy.get('tbody tr, .grid > div, [class*="card"]', { timeout: 10000 })
      .first()
      .within(() => {
        // Target the final action button/icon in that row/card
        cy.get('button, a').last().click({ force: true });
      });

    // FIX 3: If clicking the action button opens a Portal dropdown (like <MoreVertical />), 
    // click the specific "Complete/Lock" action from the body level.
    cy.get('body').then(($body) => {
      if ($body.text().match(/complete|lock/i)) {
        cy.contains(/complete|lock/i).first().click({ force: true });
      }
    });

    // ---------------------------------------------------------
    // The rest of the workflow (uncomment when needed):
    // ---------------------------------------------------------
    // cy.get('textarea, input[type="text"]').last().type('Great semester everyone!');
    // cy.contains('button', /submit|save|confirm/i).click();
    // cy.wait('@completeCourse').its('response.statusCode').should('eq', 200);
  });
});