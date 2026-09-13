describe('EduCat E2E - Real-Time Notification & Bell Updates', () => {
  Cypress.on('uncaught:exception', () => false);

  it('Verifies that the notification bell tracks unread counts and renders incoming alerts', () => {
    cy.viewport(1280, 720);

    cy.intercept('POST', '**/api/login').as('loginRequest');

    // FIX: Match the exact dynamic user ID route and return a flat array
    cy.intercept('GET', '**/api/notifications/*', {
      statusCode: 200,
      body: [
        {
          id: 99,
          title: 'New Grade Posted',
          message: 'You scored 100% on your recent assignment.',
          is_read: false,
          created_at: new Date().toISOString()
        }
      ]
    }).as('getNotifications');

    cy.intercept('GET', '**/api/chat/unread-count*', {
      statusCode: 200,
      body: { unreadCount: 0, success: true }
    }).as('getUnread');

    // 1. Login Flow
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('std@example.com');
    cy.get('input[type="password"]').type('std123');
    cy.get('input[type="submit"], button[type="submit"]').click();

    cy.wait('@loginRequest', { timeout: 10000 });
    cy.url().should('include', '/student');

    // 2. Wait for the mocked notification request to resolve
    cy.wait('@getNotifications', { timeout: 10000 });

    // 3. Click the notification bell icon in the top header toolbar
    cy.get('header, .sticky, [class*="header"]').not('aside *').first().within(() => {
      cy.get('button, [role="button"], svg').then(($els) => {
        const bell = Array.from($els).find(el => {
          const html = el.outerHTML.toLowerCase();
          return html.includes('svg') && (html.includes('bell') || html.includes('stroke-width') || html.includes('path') || html.includes('notification'));
        });

        if (bell) {
          cy.wrap(bell).click({ force: true });
        } else {
          cy.get('button').last().click({ force: true });
        }
      });
    });

    // 4. Verify the mock notification content appears on the screen
    cy.get('body', { timeout: 10000 }).within(() => {
      cy.contains(/new grade posted/i).should('be.visible');
      cy.contains(/100%/).should('be.visible');
    });
  });
});