describe('Finance Admin - Staff Payroll', () => {
  it('Adjusts a moderator salary and records the payment', () => {
    cy.viewport(1280, 720);

    cy.intercept('GET', '**/api/admin/payroll*').as('getPayroll');

    cy.visit('http://localhost:5173/login');
    
    // FIX: Use the correct email account configured for the finance role in the database
    cy.get('input[type="email"]').type('finance.test@example.com');
    cy.get('input[type="password"]').type('Finance123!');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.url().should('include', '/admin');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    cy.visit('http://localhost:5173/admin/staff-payroll');
    
    cy.wait('@getPayroll', { timeout: 10000 });
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Edit"), svg, .lucide-edit, button').length === 0) {
        throw new Error(
          '🛑 TEST HALTED: No staff payroll records found in the database.'
        );
      }
    });

    cy.get('button, svg').filter(':has(svg), :contains("Edit"), [class*="edit"]').first().click({ force: true });

    cy.get('input[placeholder="Bonus"], input[name="bonus"], input[type="number"]').first().clear().type('5000');
    
    cy.contains(/save|update|record|submit/i).click();

    cy.contains(/success|updated|recorded/i, { timeout: 10000 }).should('be.visible');
  });
});