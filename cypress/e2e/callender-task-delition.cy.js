describe('Student - Calendar Task Deletion', () => {
  it('Deletes a personal to-do item from the calendar', () => {
    cy.visit('http://localhost:5173/login');
    
    // 1. MUST BE A REAL STUDENT IN YOUR DATABASE
    cy.get('input[type="email"]').type('std@example.com');
    cy.get('input[type="password"]').type('std123');
    cy.get('input[type="submit"]').click();

    // 2. Synchronization Checkpoint: Wait for backend auth to finish
    cy.url().should('include', '/student');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    // 3. Navigate safely using the sidebar visible text
    cy.contains('Calendar').click();
    
    // Wait for the calendar to finish fetching events
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
    
    // 4. Add a temporary task to ensure there is something to delete
    cy.get('.react-calendar__tile').eq(10).click();  
    
    // --- Paste the rest of your original test's deletion logic below this line ---
    
  });
});