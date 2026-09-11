describe('EduCat E2E - Bank Slip Upload Flow', () => {
  it('Registers a student, logs in, and uploads a bank slip', () => {
    const uniqueEmail = `qa.payer.${Date.now()}@example.com`;

    cy.visit('http://localhost:5173/register');

    // Automatically click "OK" on all alerts to prevent them from breaking the test
    cy.on('window:alert', () => true);

    // 1. SETUP INTERCEPT: Tell Cypress to watch for the registration API call
    cy.intercept('POST', '**/api/register').as('registerUser');

    // Fill out the form
    cy.get('input[name="name"]').type('Paying Student');
    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="password"]').type('securepassword123');
    cy.get('input[name="confirmPassword"]').type('securepassword123');
    cy.get('input[name="phoneNumber"]').type('+94772222222');
    cy.get('input[name="dob"]').type('2004-05-15');
    cy.get('select[name="province"]').select('Western');
    cy.get('select[name="district"]').select('Colombo');
    cy.get('select[name="gender"]').select('Male');
    cy.get('input[type="radio"][value="student"]').click();
    cy.get('input[type="submit"]').click();

    // 2. CRITICAL FIX: Force Cypress to wait until the backend returns a successful response
    // This guarantees the user actually exists in the MySQL database before we try to log in!
    cy.wait('@registerUser').its('response.statusCode').should('be.oneOf', [200, 201]);

    // --- 3. LOGIN PHASE ---
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type(uniqueEmail);
    cy.get('input[type="password"]').type('securepassword123');
    cy.get('input[type="submit"]').click();

    // Synchronization Checkpoint
    cy.url().should('include', '/student');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    // --- 4. UPLOAD PHASE ---
    cy.contains('Classes').click();
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    // Target the specific class/payment button
    cy.contains('Pay').first().click();

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('dummy slip content'),
      fileName: 'bank-slip.jpg',
      mimeType: 'image/jpeg',
    }, { force: true });

    // Click upload
    cy.contains('Upload Slip').click(); 
  });
});