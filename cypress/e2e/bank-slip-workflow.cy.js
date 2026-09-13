describe('EduCat E2E - Bank Slip Upload Flow', () => {
  it('Registers a student, logs in, and uploads a bank slip', () => {
    cy.viewport(1280, 720);

    const uniqueEmail = `qa.payer.${Date.now()}@example.com`;
    
    // 1. Registration Flow
    cy.visit('http://localhost:5173/register');
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
    
    cy.intercept('POST', '**/api/register').as('registerUser');
    cy.get('input[type="submit"]').click();
    cy.wait('@registerUser').its('response.statusCode').should('be.oneOf', [200, 201]);

    // 2. Intercepts and Robust Mock Data
    cy.intercept('POST', '**/api/login').as('loginRequest');
    
    // CRITICAL FIX: Provide all properties the UI expects, especially strings 
    // that might be parsed for avatars (like teacher_name).
    cy.intercept('GET', '**/api/student/classes*', {
      statusCode: 200,
      body: [
        { 
          id: 1,
          course_id: 101, 
          title: 'Mock Physics Class', 
          teacher_name: 'QA Teacher', // Prevents the "reading '0'" crash
          payment_status: 'pending', 
          monthly_fee: 2500,
          cover_image: null
        }
      ]
    }).as('getStudentClasses');

    // Prevent secondary crashes from the suggested classes endpoint
    cy.intercept('GET', '**/api/suggested-classes*', {
      statusCode: 200,
      body: [] 
    }).as('getSuggestedClasses');

    cy.intercept('POST', '**/api/**/upload-slip*', {
      statusCode: 200,
      body: { success: true, message: 'Slip uploaded successfully' }
    }).as('uploadSlip');

    // 3. Login Flow
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type(uniqueEmail);
    cy.get('input[type="password"]').type('securepassword123');
    cy.get('input[type="submit"]').click();
    
    cy.wait('@loginRequest', { timeout: 10000 });
    cy.url().should('include', '/student');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    // 4. Navigate to Classes
    cy.get('aside').contains('Classes').click();
    
    cy.wait('@getStudentClasses', { timeout: 10000 });
    cy.get('.animate-pulse, .loading-spinner').should('not.exist');

    // 5. Interact with Payment Modal
    cy.contains(/pay|upload slip/i).first().click({ force: true });

    cy.get('input[type="file"]', { timeout: 10000 }).selectFile({
      contents: Cypress.Buffer.from('dummy bank slip content'),
      fileName: 'bank_slip.jpg',
      mimeType: 'image/jpeg',
    }, { force: true });

    cy.contains('button', /upload|submit|confirm|save/i).first().click({ force: true });
  });
});