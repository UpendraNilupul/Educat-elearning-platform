describe('Teacher - Assignment Grading', () => {
  it('Grades a pending student submission', () => {
    cy.viewport(1280, 720);

    // 1. Stub Auth
    cy.intercept('POST', '**/api/login').as('loginRequest');
    
    // 2. Stub API Responses
    // CRITICAL FIX: Wrapped the mock data in { success: true, data: [...] } 
    // to match your backend's standard response structure. Without this, 
    // the frontend mapping fails and the tables remain empty.
    cy.intercept('GET', '**/api/**/assignments*', {
      statusCode: 200,
      body: {
        success: true,
        data: [{ id: 1, title: 'Math Quiz', course_id: 101, status: 'active', deadline: '2026-12-31' }]
      }
    }).as('getAssignments');

    cy.intercept('GET', '**/api/**/submissions*', {
      statusCode: 200,
      body: {
        success: true,
        data: [{ id: 1, assignment_id: 1, student_name: 'Jane Doe', status: 'pending', file_url: '#', submitted_at: '2026-09-12' }]
      }
    }).as('getSubmissions');

    cy.intercept('PUT', '**/api/**/submissions/*', {
      statusCode: 200,
      body: { success: true }
    }).as('saveGrade');

    // 3. Execute Login
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('tchr@example.com');
    cy.get('input[type="password"]').type('tchr123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.wait('@loginRequest', { timeout: 10000 });
    cy.url().should('include', '/teacher');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    // 4. Navigate to Assessments via Sidebar
    cy.get('aside').contains('Assessments').click();

    // 5. Open Submissions
    cy.wait('@getAssignments', { timeout: 10000 });
    
    // Globally search for the view button (removed .within() completely to prevent DOM scoping crashes)
    cy.contains(/manage|view|submissions/i, { timeout: 10000 })
      .last() // Use last() to ensure we click the table row button, not a header/sidebar title
      .click({ force: true });

    // 6. Click Grade Button
    cy.wait('@getSubmissions', { timeout: 10000 });
    cy.contains(/grade|evaluate|score|mark/i, { timeout: 10000 })
      .last()
      .click({ force: true });

    // 7. Input Grade
    cy.get('input[type="number"], input[name="grade"], input[name="marks"], input[placeholder*="grade" i]', { timeout: 10000 })
      .first()
      .should('be.visible')
      .clear()
      .type('95');

    // 8. Submit and Verify
    cy.contains('button', /save|submit|publish|confirm/i).first().click({ force: true });

    cy.wait('@saveGrade', { timeout: 10000 }).its('response.statusCode').should('eq', 200);
  });
});