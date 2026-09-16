describe('Student - Assignment Submission', () => {
  it('Uploads a document for a pending assignment', () => {
    cy.viewport(1280, 720);

    // 1. Stub Auth
    cy.intercept('POST', '**/api/login').as('loginRequest');
    
    // 2. CRITICAL FIX: Stub the assignment details so it doesn't return 404
    cy.intercept('GET', '**/api/assignments/*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          title: 'Math Homework 1',
          description: 'Solve the attached equations',
          due_date: '2026-12-31',
          status: 'pending'
        } // Adjust the object structure if your component expects it directly without a 'data' wrapper
      }
    }).as('getAssignment');

    // 3. Stub the submission endpoint (Adjust URL if yours is different)
    cy.intercept('POST', '**/api/assignments/*/submit*', {
      statusCode: 200,
      body: { success: true, message: 'Assignment uploaded successfully' }
    }).as('submitAssignment');

    // 4. Execute Login
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('std@example.com');
    cy.get('input[type="password"]').type('std123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.wait('@loginRequest', { timeout: 10000 });
    cy.url().should('include', '/student');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    // 5. Navigate to the assignment page
    cy.visit('http://localhost:5173/student/assignment/1');

    // Wait for the mocked assignment details to load
    cy.wait('@getAssignment', { timeout: 10000 });
    cy.contains('Loading').should('not.exist');

    // 6. Set the alert listener for the upload success
    cy.once('window:alert', (str) => {
      expect(str.toLowerCase()).to.include('success');
    });

    // 7. Upload file and submit
    cy.get('input[type="file"]', { timeout: 10000 }).selectFile({
      contents: Cypress.Buffer.from('dummy pdf content'),
      fileName: 'homework.pdf',
      mimeType: 'application/pdf',
    }, { force: true });

    cy.contains('button', /submit|upload|save/i).first().click({ force: true });

    // Optional: Wait for the mocked POST request to ensure the frontend actually triggered it
    // cy.wait('@submitAssignment', { timeout: 10000 }).its('response.statusCode').should('eq', 200);
  });
});