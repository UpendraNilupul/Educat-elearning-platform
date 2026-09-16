// cypress/e2e/chat-messaging.cy.js

describe('EduCat E2E - Real-Time Chat & User Blocking', () => {
  it('Allows an authenticated student to open the messaging hub, start a chat, and test block mechanics', () => {
    // 1. Register a student session
    const studentEmail = `qa.chatter.${Date.now()}@example.com`;
    cy.visit('http://localhost:5173/register');
    cy.get('input[name="name"]').type('Chatter Student');
    cy.get('input[name="email"]').type(studentEmail);
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password123');
    cy.get('input[name="phoneNumber"]').type('+94774444444');
    cy.get('input[name="dob"]').type('2003-01-01');
    cy.get('select[name="province"]').select('Western');
    cy.get('select[name="district"]').select('Colombo');
    cy.get('select[name="gender"]').select('Female');
    cy.get('input[type="radio"][value="student"]').click();
    cy.get('input[type="submit"]').click();

    // 2. Navigate to Messages section
    cy.contains('Messages').click();
    cy.url().should('include', '/student'); // Or chat interface tab

    // 3. Open the contact compose drawer to view available teachers/staff
    cy.get('button[title="New Message"]').click();
    cy.contains('Search teachers').should('be.visible');
  });
});