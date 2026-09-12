describe('Student - Assignment Submission', () => {
  it('Uploads a document for a pending assignment', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('std@example.com');
    cy.get('input[type="password"]').type('std123');
    cy.get('input[type="submit"]').click();

    // 1. Synchronization Checkpoint: Wait for backend auth to finish
    cy.url().should('include', '/student');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    // 2. NOW it is safe to deep-link, because the auth token is active
    cy.visit('http://localhost:5173/student/assignment/1');
    
    // Wait for the assignment data to fetch
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    // 3. Attach the dummy file
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('dummy homework content'),
      fileName: 'homework.pdf',
      mimeType: 'application/pdf',
    }, { force: true });

    // 4. Set the alert listener strictly for the upload success
    cy.once('window:alert', (str) => {
      expect(str.toLowerCase()).to.include('success');
    });

    // 5. Submit the assignment
    cy.contains('Submit Assignment').click();
  });
});