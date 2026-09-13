describe('Teacher - Advertisement Deletion', () => {
  it('Deletes an existing promotional banner', () => {
    cy.viewport(1280, 720);

    cy.intercept('POST', '**/api/login').as('loginRequest');
    
    // FIX: Intercept teacher advertisements to guarantee an ad exists for deletion
    cy.intercept('GET', '**/api/teacher/advertisements', {
      statusCode: 200,
      body: [
        {
          id: 1,
          t_id: 17,
          ad_link: 'https://via.placeholder.com/300',
          is_published: false
        }
      ]
    }).as('getTeacherAds');

    cy.intercept('DELETE', '**/api/teacher/advertisements/*').as('deleteAd');

    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('tchr@example.com');
    cy.get('input[type="password"]').type('tchr123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.wait('@loginRequest', { timeout: 10000 });
    cy.url().should('include', '/teacher');

    cy.get('aside', { timeout: 10000 }).should('be.visible'); 
    cy.contains('Advertisements').click();

    cy.wait('@getTeacherAds', { timeout: 10000 });
    cy.contains('Loading...').should('not.exist');

    cy.on('window:confirm', () => true);

    cy.contains(/delete|trash/i).first().click({ force: true });

    cy.wait('@deleteAd', { timeout: 10000 }).its('response.statusCode').should('eq', 200);
  });
});