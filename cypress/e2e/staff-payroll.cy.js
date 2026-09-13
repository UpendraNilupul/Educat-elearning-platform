describe('Finance Admin - Staff Payroll', () => {
  Cypress.on('uncaught:exception', () => false);

  it('Adjusts a moderator salary and records the payment', () => {
    cy.viewport(1280, 720);

    // 1. Stub login request
    cy.intercept('POST', '**/api/login', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Login successful',
        user: { id: 1, email: 'finance.test@example.com', role: 'admin' }
      }
    }).as('loginRequest');

    cy.intercept('GET', '**/api/admin/staff-payouts*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 101,
            sub_admin_id: 5,
            admin_name: 'John Moderator',
            base_salary: 50000,
            adjustment: 0,
            net_payable: 50000,
            amount_paid: 0,
            payment_status: 'unpaid'
          }
        ],
        stats: { totalSalaries: 50000, totalAdjustments: 0, totalToPay: 50000 }
      }
    }).as('getPayouts');

    cy.intercept('PUT', '**/api/admin/staff-payouts/*/update', {
      statusCode: 200,
      body: { success: true, message: 'Salary updated successfully' }
    }).as('updateSalary');

    cy.intercept('POST', '**/api/admin/staff-payouts/*/pay', {
      statusCode: 200,
      body: { success: true, message: 'Payment recorded successfully' }
    }).as('recordPayment');

    // 2. Visit login and seed localStorage to bypass role guards
    cy.visit('http://localhost:5173/login', {
      onBeforeLoad(win) {
        win.localStorage.setItem('userId', '1');
        win.localStorage.setItem('userRole', 'admin');
        win.localStorage.setItem('token', 'mock-jwt-token');
      }
    });

    cy.get('input[type="email"]').type('finance.test@example.com');
    cy.get('input[type="password"]').type('Finance123!');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.wait('@loginRequest', { timeout: 10000 });

    // 3. Direct Navigation to Staff Payroll with localStorage preserved
    cy.visit('http://localhost:5173/admin/staff-payroll', {
      onBeforeLoad(win) {
        win.localStorage.setItem('userId', '1');
        win.localStorage.setItem('userRole', 'admin');
        win.localStorage.setItem('token', 'mock-jwt-token');
      }
    });

    // 4. Adjust Moderator Salary
    cy.contains(/john moderator/i, { timeout: 15000 })
      .should('be.visible')
      .parents('tr')
      .first()
      .within(() => {
        cy.get('td').eq(2).click({ force: true });
      });

    cy.get('input[placeholder="Salary"], input[type="number"]').first().clear().type('55000');
    
    cy.get('button').filter((i, el) => el.querySelector('svg.lucide-save') || el.innerText.match(/save/i)).first().click({ force: true });

    // 5. Record Payment
    cy.contains(/john moderator/i, { timeout: 10000 })
      .parents('tr')
      .first()
      .within(() => {
        cy.contains('button', /pay/i).click({ force: true });
      });

    cy.get('div.fixed', { timeout: 10000 }).within(() => {
      cy.get('button[type="submit"]').click({ force: true });
    });

    cy.wait('@recordPayment', { timeout: 10000 });
  });
});