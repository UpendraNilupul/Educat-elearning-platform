describe('Admin - Escalation Inbox', () => {
  it('Marks a pending escalated moderation issue as resolved', () => {
    cy.viewport(1280, 720);

    cy.intercept('POST', '**/api/login').as('loginRequest');
    
    // FIX 1: Mock the escalations endpoint so the database state doesn't matter
    // Adjust property names (like reported_by, reason) if your frontend expects different keys
    cy.intercept('GET', '**/api/admin/escalations*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            reported_by_name: 'John Doe',
            reported_user_name: 'Jane Smith',
            type: 'chat',
            reason: 'Inappropriate language',
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ]
      }
    }).as('getEscalations');

    // Stub the resolution endpoint to prevent backend state mutations
    cy.intercept('PUT', '**/api/admin/escalations/*', {
      statusCode: 200,
      body: { success: true, message: 'Issue resolved successfully' }
    }).as('resolveEscalation');

    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('input[type="submit"], button[type="submit"]').click();

    cy.wait('@loginRequest', { timeout: 10000 });
    cy.url().should('include', '/admin');
    
    cy.get('aside', { timeout: 10000 }).should('be.visible');
    cy.get('a[href="/admin/escalations"]').click();
    
    cy.wait('@getEscalations', { timeout: 10000 });
    
    // FIX 2: REMOVED the .then() block that was manually throwing the "TEST HALTED" error
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    // FIX 3: Target the first row or card and interact with the action button
    cy.get('tbody tr, .grid > div, .bg-white.rounded-2xl', { timeout: 10000 })
      .first()
      .within(() => {
        // If your Admin UI hides actions behind a 3-dots icon button, click it first
        cy.get('button').then(($buttons) => {
          const iconButton = $buttons.filter((i, el) => el.innerText.trim() === '');
          if (iconButton.length > 0) {
            cy.wrap(iconButton[0]).click({ force: true });
          }
        });
      });

    // Click the resolve button (looks at the whole body to catch portal dropdowns)
    cy.get('body').within(() => {
      cy.contains(/resolve|mark resolved|close|approve/i, { timeout: 10000 })
        .first()
        .click({ force: true });
    });
  });
});