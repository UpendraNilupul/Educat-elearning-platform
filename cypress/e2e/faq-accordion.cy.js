describe('Public - FAQ Accordion', () => {
  it('Opens an FAQ item to read the answer', () => {
    cy.visit('http://localhost:5173/faq');
    
    // Click the first FAQ question button
    cy.get('button').contains('How do I enroll in a class?').click();
    
    // Verify the corresponding answer becomes visible
    cy.contains('To enroll, simply create a student account').should('be.visible');
  });
});
