describe('Admin - Global Announcements', () => {
  it('Broadcasts a message to all users', () => {
    cy.viewport(1280, 720);

    // 1. Intercept the network requests that populate your custom audience selector
    cy.intercept('GET', '**/api/admin/all-courses').as('getCourses');
    cy.intercept('GET', '**/api/admin/subjects').as('getSubjects');
    
    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.url().should('include', '/admin');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    cy.visit('http://localhost:5173/admin/announcements');
    
    // 2. Wait for the custom dropdown data to finish loading into the React state
    cy.wait('@getCourses', { timeout: 10000 });
    cy.wait('@getSubjects', { timeout: 10000 });
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    // 3. Target "Everyone" globally (removed the .within('form') restriction)
    // Using { force: true } in case Tailwind visually obscures the click target
    cy.contains('Everyone').click({ force: true });
    
    // 4. Fill and submit
    cy.get('input[type="text"]').first().type('System Maintenance Update');
    cy.get('textarea').first().type('The platform will be down for 15 minutes tonight for updates.');
    
    // Target the primary form submission button
    cy.get('button[type="submit"], input[type="submit"]').last().click();
  });
});