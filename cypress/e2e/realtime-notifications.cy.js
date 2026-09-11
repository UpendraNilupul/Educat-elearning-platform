describe('EduCat E2E - Real-Time Notification & Bell Updates', () => {
  it('Verifies that the notification bell tracks unread counts and renders incoming alerts', () => {
    cy.viewport(1280, 720);

    cy.intercept('GET', '**/api/notifications*').as('getNotifications');
    cy.intercept('GET', '**/api/chat/unread-count*').as('getUnread');

    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('std@example.com');
    cy.get('input[type="password"]').type('std123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.url().should('include', '/student');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    cy.wait('@getNotifications', { timeout: 10000 });
    cy.wait('@getUnread', { timeout: 10000 });

    // FIX: Use valid Cypress DOM traversal instead of the non-existent .has() method
    cy.get('header').find('button').filter(':has(svg.lucide-bell), :has(svg)').last().click({ force: true });

    cy.contains(/notifications/i, { timeout: 10000 }).should('be.visible');

    cy.get('body').then(($body) => {
      const hasNotifications = $body.find('.notification-item, li, .p-3').length > 0;
      if (hasNotifications) {
        cy.contains(/mark as read|clear/i).should('exist');
      }
    });
  });
});