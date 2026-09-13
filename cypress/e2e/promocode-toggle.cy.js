describe('Admin - Promo Code Toggle', () => {
  it('Deactivates an active promo code', () => {
    cy.viewport(1280, 720);

    cy.intercept('POST', '**/api/login').as('loginRequest');

    // FIX 1: Mock the promo codes endpoint so the test is 100% deterministic
    cy.intercept('GET', '**/api/admin/promo-codes*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 1,
            code: 'CYPRESS50',
            course_title: 'Automated Testing Masterclass',
            discount_percent: 0.5, // UI expects a decimal (renders as 50%)
            // Set far in the future so the frontend Date() check doesn't auto-expire it
            expire_date: '2100-12-31', 
            status: 'active'
          }
        ]
      }
    }).as('getPromos');

    // Prevent background crashes if the courses API also fires
    cy.intercept('GET', '**/api/admin/all-courses*', {
      statusCode: 200,
      body: { success: true, data: [] }
    }).as('getCourses');

    // FIX 2: Stub the PUT request to prevent modifying real database records
    cy.intercept('PUT', '**/api/admin/promo-codes/*/status', {
      statusCode: 200,
      body: { success: true, message: 'Status updated' }
    }).as('toggleStatus');

    // Execute Login
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('input[type="submit"], button[type="submit"]').click();

    cy.wait('@loginRequest', { timeout: 10000 });
    cy.url().should('include', '/admin');
    
    // Navigate to Promos
    cy.visit('http://localhost:5173/admin/promos');
    
    cy.wait('@getPromos', { timeout: 10000 });
    
    // FIX 3: Replaced the manual 'throw new Error' block with standard assertions
    cy.contains('Loading codes...', { timeout: 10000 }).should('not.exist');

    // Ensure the mock data rendered correctly
    cy.contains('CYPRESS50').should('be.visible');

    // Click the Deactivate button
    cy.contains('Deactivate').should('be.visible').click();

    // Verify the frontend sent the correct payload to the backend
    cy.wait('@toggleStatus').its('request.body').should('deep.equal', {
      status: 'expired'
    });
  });
});