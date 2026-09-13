describe('Authentication - Forgot Password', () => {
  it('Executes the 3-step OTP password reset process', () => {
    cy.viewport(1280, 720);

    // 1. Exact intercepts based on the routes in Login.jsx
    cy.intercept('POST', '**/forgot-password/send-otp*', {
      statusCode: 200,
      body: { success: true, message: 'OTP sent' }
    }).as('sendOtp');

    cy.intercept('POST', '**/forgot-password/verify-otp*', {
      statusCode: 200,
      body: { success: true, message: 'OTP verified' }
    }).as('verifyOtp');

    cy.intercept('POST', '**/forgot-password/reset-password*', {
      statusCode: 200,
      body: { success: true, message: 'Password reset' }
    }).as('resetPassword');

    // Start Flow
    cy.visit('http://localhost:5173/login');
    
    // Target the specific "click here" button for forgot password
    cy.contains('forget password?').find('button').click();

    // STEP 1: Enter Email
    cy.get('input[type="email"]').should('be.visible').type('std@example.com'); 
    cy.get('input[value="Send OTP"]').click();

    cy.wait('@sendOtp', { timeout: 10000 });

    // STEP 2: Enter OTP
    cy.get('input[placeholder="Enter OTP"]').should('be.visible').type('123456');
    cy.get('input[value="Verify OTP"]').click();

    cy.wait('@verifyOtp', { timeout: 10000 });

    // STEP 3: Enter New Password
    cy.get('input[placeholder="New Password"]').should('be.visible').type('newpassword123');
    cy.get('input[value="Reset Password"]').click();

    cy.wait('@resetPassword', { timeout: 10000 });
    
    // Verify it returns to the login screen upon completion
    cy.contains('login now').should('be.visible');
  });
});