describe('Admin - Advertisement Management', () => {
  it('Publishes a pending teacher advertisement to the platform', () => {
    cy.viewport(1280, 720);

    cy.intercept('GET', '**/api/admin/advertisements', {
      statusCode: 200,
      body: [
        {
          id: 1,
          t_id: 10,
          ad_link: 'https://via.placeholder.com/300',
          is_published: false,
          teacher_name: 'QA Teacher'
        }
      ]
    }).as('getAdvertisements');

    cy.intercept('PUT', '**/api/admin/advertisements/*/toggle').as('togglePublish');

    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.url().should('include', '/admin');
    
    cy.get('nav a[href="/admin/advertisements"]').click();
    cy.url().should('include', '/admin/advertisements');

    cy.wait('@getAdvertisements', { timeout: 10000 });
    cy.contains('Loading advertisements...').should('not.exist');

    cy.contains('Teacher Uploads').click();

    // FIX: Ensure parents() yields a single element using .first() before invoking .within()
    cy.contains('Pending', { timeout: 10000 })
      .first()
      .parents('.bg-white')
      .first()
      .within(() => {
        cy.contains('Publish').click();
      });

    cy.wait('@togglePublish', { timeout: 10000 }).its('response.statusCode').should('eq', 200);
  });
});