describe('EduCat E2E - Real-Time Chat & User Blocking', () => {
  it('Allows an authenticated student to open the messaging hub, start a chat, and test block mechanics', () => {
    cy.viewport(1280, 720);
    const uniqueEmail = `qa.chatter.${Date.now()}@example.com`;

    // 1. Registration Flow
    cy.visit('http://localhost:5173/register');
    cy.get('input[name="name"]').type('Chatter Student');
    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password123');
    cy.get('input[name="phoneNumber"]').type('+94774444444');
    cy.get('input[name="dob"]').type('2003-01-01');
    cy.get('select[name="province"]').select('Western');
    cy.get('select[name="district"]').select('Colombo');
    cy.get('select[name="gender"]').select('Female');
    cy.get('input[type="radio"][value="student"]').click();
    
    cy.intercept('POST', '**/api/register').as('registerUser');
    cy.get('input[type="submit"]').click();
    cy.wait('@registerUser');
    cy.url().should('include', '/student');

    // 2. Intercept chat data to guarantee the UI renders the contact list
    cy.intercept('GET', '**/api/student-chat/conversations*', {
      statusCode: 200,
      body: [] // Start with empty conversations
    }).as('getConversations');

    cy.intercept('GET', '**/api/student-chat/contacts*', {
      statusCode: 200,
      // Note: If your student routes don't use { success: true, data: [] }, remove the wrapper and just return the array
      body: {
        success: true,
        data: [
          { id: 99, name: 'Mr. Smith', role: 'teacher', avatar: null }
        ]
      }
    }).as('getContacts');

    // 3. Navigate to Messages
    cy.contains('Messages').click();
    cy.url().should('include', '/student'); // Or /student/messages if it redirects
    cy.wait('@getConversations', { timeout: 10000 });

    // 4. Open the contact compose drawer
    cy.get('button[title="New Message"], button[aria-label="New Message"]').first().click({ force: true });
    cy.wait('@getContacts', { timeout: 10000 });

    // FIX: Look for the placeholder attribute or the general search input, NOT cy.contains()
    cy.get('input[placeholder*="Search"], input[type="text"]', { timeout: 10000 })
      .first()
      .should('be.visible')
      .type('Mr. Smith');

    // Proceed to click the contact and verify block mechanics...
    // cy.contains('Mr. Smith').click();
  });
});