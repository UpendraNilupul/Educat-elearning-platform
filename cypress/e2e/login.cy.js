describe('EduCat E2E - Student Authentication Flow', () => {
  const testEmail = `qa.student.${Date.now()}@example.com`;
  const testPassword = 'securepassword123';

  it('Completes the full registration, logout, and login cycle', () => {
    // --- PART 1: REGISTRATION ---
    cy.visit('http://localhost:5173/register');

    cy.get('input[name="name"]').type('Automated QA Student');
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('input[name="confirmPassword"]').type(testPassword);
    cy.get('input[name="phoneNumber"]').type('+94771234567');
    cy.get('input[name="dob"]').type('2005-01-01');
    
    cy.get('select[name="province"]').select('Western');
    cy.get('select[name="district"]').select('Colombo');
    cy.get('select[name="gender"]').select('Female');
    
    cy.get('input[type="radio"][value="student"]').click();
    cy.get('input[type="submit"]').click();

    // Verify successful redirect using the Welcome text
    cy.url().should('include', '/student');
    cy.contains('Welcome back').should('be.visible');

    // --- PART 2: LOGOUT ---
    cy.contains('Logout').click();
    
    // Your app redirects to the homepage ("/") on logout
    cy.url().should('eq', 'http://localhost:5173/');

    // --- PART 3: LOGIN ---
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type(testEmail);
    cy.get('input[type="password"]').type(testPassword);
    cy.get('input[type="submit"]').click();

    // Verify login routes back to the dashboard
    cy.url().should('include', '/student');
    cy.contains('Welcome back').should('be.visible');
  });
});