describe('Teacher - Live Class Configuration', () => {
  it('Schedules a live class and validates date input restrictions', () => {
    cy.viewport(1280, 720);
    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('tchr@example.com');
    cy.get('input[type="password"]').type('tchr123');
    cy.get('input[type="submit"], button[type="submit"]').click();

    cy.url().should('include', '/teacher');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    cy.contains(/virtual classroom/i).click();
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');
    
    cy.contains(/schedule class/i).click();
    
    // FIX: Dynamically evaluate the dropdown options before attempting to select
    cy.get('select[name="course_id"]').then(($select) => {
      // Look for options that do NOT have the 'disabled' attribute
      const $validOptions = $select.find('option:not([disabled])');
      
      if ($validOptions.length === 0) {
        // If the array is empty, halt the test gracefully with a clear instruction
        throw new Error(
          '🛑 TEST HALTED: Your database is empty. The teacher (tchr@example.com) has no active courses. You must create a course for this teacher first before testing the Live Class scheduler.'
        );
      } else {
        // If valid courses exist, safely select the first available one using its underlying value
        cy.wrap($select).select($validOptions.first().val());
      }
    });
    
    // --- Paste the rest of your original scheduling and date validation logic below this line ---
    
  });
});