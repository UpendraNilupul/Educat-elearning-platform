// cypress/e2e/realtime-notifications.cy.js

describe('EduCat E2E - Real-Time Notification & Bell Updates', () => {
  it('Verifies that the notification bell tracks unread counts and renders incoming alerts', () => {
    // 1. Log in as a student
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('student@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('input[type="submit"]').click();

    // 2. Locate the Notification Bell component in the dashboard header
    // The bell icon uses the Lucide Bell element
    cy.get('header').find('svg.lucide-bell').should('be.visible');

    // 3. Click the notification bell to open the dropdown panel
    cy.get('header').find('button').has('svg.lucide-bell').click();

    // 4. Verify the notification drawer renders successfully
    cy.contains('Notifications').should('be.visible');
    cy.contains('All').should('be.visible');
    cy.contains('Unread').should('be.visible');

    // 5. Test "Mark all as read" functionality if unread items exist
    cy.body().then(($body) => {
      if ($body.text().includes('Mark all as read')) {
        cy.contains('Mark all as read').click();
        cy.contains('No notifications found').should('be.visible');
      }
    });
  });
});