describe('Teacher - Advertisement Upload', () => {
  it('Uploads a promotional image banner', () => {
    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('tchr@example.com');
    cy.get('input[type="password"]').type('tchr123');
    cy.get('input[type="submit"]').click();

    // 1. Synchronization Checkpoint: Ensure login was successful
    cy.url().should('include', '/teacher');
    
    // Fix 1: Add a quick wait for the dashboard to render completely
    cy.get('aside', { timeout: 10000 }).should('be.visible'); 
    
    // Fix 2: Click the sidebar link by its visible text instead of its HTML href.
    // NOTE: If your sidebar button is named something else (like "Promotions" or "Manage Ads"), 
    // change the text below to match exactly what is on your screen.
    cy.contains('Advertisements').click();
    
    // Wait for the new page to fetch data
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    // Attach the dummy file
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('dummy image content'),
      fileName: 'promo-banner.jpg',
      mimeType: 'image/jpeg',
    }, { force: true });

    // Set the alert listener strictly for the upload success
    cy.once('window:alert', (str) => {
      expect(str.toLowerCase()).to.include('success');
    });

    cy.contains('Upload Advertisement').click();
  });
});