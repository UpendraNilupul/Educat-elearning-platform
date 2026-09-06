describe('EduCat RBAC - Security Restrictions', () => {
  const testEmail = `qa.sneaky.student.${Date.now()}@example.com`;

  it('Prevents an authenticated student from accessing the Admin panel', () => {
    // 1. Establish a valid student session
    cy.visit('http://localhost:5173/register');
    cy.get('input[name="name"]').type('Sneaky Student');
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password123');
    cy.get('input[name="phoneNumber"]').type('+94771111111');
    cy.get('input[name="dob"]').type('2005-01-01');
    cy.get('select[name="province"]').select('Western');
    cy.get('select[name="district"]').select('Colombo');
    cy.get('select[name="gender"]').select('Male');
    cy.get('input[type="radio"][value="student"]').click();
    cy.get('input[type="submit"]').click();

    // Confirm the student is logged in
    cy.url().should('include', '/student');

    // 2. The Exploit Attempt: Force the browser directly to the admin dashboard
    cy.visit('http://localhost:5173/admin');

    // 3. Security Verification: The router should instantly kick them out
    // Based on App.jsx, a non-admin hitting /admin redirects to "/"
    cy.url().should('eq', 'http://localhost:5173/');
  });
});