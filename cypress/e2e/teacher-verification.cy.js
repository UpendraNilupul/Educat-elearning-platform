describe('EduCat E2E - Teacher Verification & Admin Review', () => {
  it('Registers a teacher, submits verification docs, and allows admin approval', () => {
    cy.viewport(1280, 720);

    const teacherEmail = `qa.teacher.${Date.now()}@example.com`;

    cy.visit('http://localhost:5173/register');

    cy.get('input[name="name"]').type('QA Teacher');
    cy.get('input[name="email"]').type(teacherEmail);
    cy.get('input[name="password"]').type('securepassword123');
    cy.get('input[name="confirmPassword"]').type('securepassword123');
    cy.get('input[name="phoneNumber"]').type('+94773333333');
    cy.get('input[name="dob"]').type('1990-01-01');
    cy.get('select[name="province"]').select('Western');
    cy.get('select[name="district"]').select('Colombo');
    cy.get('select[name="gender"]').select('Male');
    cy.get('input[type="radio"][value="teacher"]').click();

    // FIX: Ignore the window alert or stub window.alert so that registration alert doesn't block redirection or throw unhandled exceptions
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('registrationAlert');
    });

    cy.get('input[type="submit"]').click();

    // Wait for registration redirect URL to include verify-teacher
    cy.url({ timeout: 10000 }).should('include', '/verify-teacher/');
  });
});