describe('Teacher - Advertisement Deletion', () => {
  it('Deletes an existing promotional banner', () => {
    cy.visit('http://localhost:5173/login');
    
    // 1. Use your actual working test credentials
    cy.get('input[type="email"]').type('tchr@example.com');
    cy.get('input[type="password"]').type('tchr123');
    cy.get('input[type="submit"]').click();

    // 2. Synchronization Checkpoint: Wait for backend auth to finish
    cy.url().should('include', '/teacher');
    cy.get('aside', { timeout: 10000 }).should('be.visible'); 
    
    // 3. Navigate safely using the sidebar visible text
    cy.contains('Advertisements').click();
    
    // 4. Wait for the advertisements grid/table to fetch
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
    
    // 5. Target the first existing ad and click delete (using force:true for hover states)
    cy.contains('Delete').first().click({ force: true });
    
    // 6. Confirm the browser pop-up and verify success
    cy.on('window:confirm', () => true);
    cy.on('window:alert', (str) => expect(str.toLowerCase()).to.include('deleted'));
  });
});