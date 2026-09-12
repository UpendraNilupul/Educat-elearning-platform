describe('Admin - Escalation Inbox', () => {
  it('Marks a pending escalated moderation issue as resolved', () => {
    cy.viewport(1280, 720);
    
    // 1. Listen for the backend request that fetches escalations
    cy.intercept('GET', '**/api/admin/escalations*').as('getEscalations');
    
    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('input[type="submit"]').click();

    cy.url().should('include', '/admin');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    cy.get('a[href="/admin/escalations"]').click();
    
    // 2. Wait for the API to respond and check the data payload
    cy.wait('@getEscalations').then((interception) => {
      const data = interception.response.body;
      
      // If the backend returns an empty array or no data, gracefully halt the test
      // Adjust data.length or data.escalations.length based on your API response structure
      if (!data || data.length === 0 || (data.data && data.data.length === 0)) {
        throw new Error(
          '🛑 TEST HALTED: Your database is empty. You must manually log into EduCat as a student or teacher, report a chat message/user to generate an escalation, and then re-run this test.'
        );
      }
    });

    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
    
    // 3. Since data exists, proceed with clicking
    cy.contains('Mark as Resolved').first().click();
    cy.on('window:confirm', () => true);
    
    cy.contains(/resolved/i).should('be.visible');
  });
});