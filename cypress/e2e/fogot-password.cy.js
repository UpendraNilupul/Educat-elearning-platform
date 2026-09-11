describe('Authentication - Forgot Password', () => {
  it('Executes the 3-step OTP password reset process', () => {
    // 1. Intercept backend routes
    cy.intercept('POST', '**/api/forgot-password/send-otp').as('sendOtp');
    cy.intercept('POST', '**/api/forgot-password/verify-otp').as('verifyOtp');
    cy.intercept('POST', '**/api/forgot-password/reset').as('resetPassword');

    cy.visit('http://localhost:5173/login');
    cy.on('window:alert', () => true);

    // Navigate to Forgot Password
    cy.contains(/forget password/i).click();

    // STEP 1: Enter Email and Submit
    cy.get('input[type="email"]').type('std@example.com'); // Note: Must exist in DB
    cy.get('button[type="submit"]').click();

    cy.wait('@sendOtp').its('response.statusCode').should('be.oneOf', [200, 201]);

    // STEP 2: Enter OTP and Submit
    // Using the exact placeholder from your original codebase
    cy.get('input[placeholder="Enter OTP"]', { timeout: 10000 })
      .should('be.visible')
      .type('123456');
    cy.get('button[type="submit"]').click();

    // STEP 3: Enter New Password and Submit
    // Target the exact password input fields sequentially to avoid guessing placeholders
    cy.get('input[type="password"]', { timeout: 10000 }).should('have.length.at.least', 2);
    cy.get('input[type="password"]').eq(0).type('newpassword123'); // New Password
    cy.get('input[type="password"]').eq(1).type('newpassword123'); // Confirm Password
    
    cy.get('button[type="submit"]').click();
  });
});