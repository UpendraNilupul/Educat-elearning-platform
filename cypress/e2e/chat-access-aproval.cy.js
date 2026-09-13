describe('Admin - Chat Access Approvals', () => {
  it('Approves a pending student chat request', () => {
    cy.viewport(1280, 720);

    cy.intercept('POST', '**/api/login').as('loginRequest');
    
    // CRITICAL FIX: Ensure data wrapper matches the pattern used in Admin_Courses
    cy.intercept('GET', '**/api/admin-chat/requests*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          { 
            id: 1, 
            request_id: 1,
            student_name: 'Test Student',
            teacher_name: 'QA Teacher', // Fallbacks for avatar rendering
            course_name: 'Math 101',
            message: 'Requesting access to course group',
            status: 'pending', // Triggers the 'pending' UI state
            created_at: new Date().toISOString()
          }
        ]
      }
    }).as('getChatRequests');

    cy.intercept('PUT', '**/api/admin-chat/requests/*', {
      statusCode: 200,
      body: { success: true, message: 'Request approved' }
    }).as('approveRequest');

    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('input[type="submit"], button[type="submit"]').click();

    cy.wait('@loginRequest', { timeout: 10000 });
    cy.url().should('include', '/admin');
    
    cy.get('nav a[href="/admin/communications"]').click();
    cy.contains('Chat Requests').click();
    
    cy.wait('@getChatRequests', { timeout: 10000 });
    cy.contains('Loading').should('not.exist');

    // FIX: Scope directly to the first rendered item (table row or grid card)
    cy.get('tbody tr, .bg-white.rounded-2xl').first().within(() => {
      
      // If you use the <MoreVertical /> 3-dots menu like in Admin_Courses, we click it first
      cy.get('button').then(($buttons) => {
        // If there's a button with no text (just an SVG icon), it's likely the dropdown toggle
        const iconButton = $buttons.filter((i, el) => el.innerText.trim() === '');
        if (iconButton.length > 0) {
          cy.wrap(iconButton[0]).click({ force: true });
        }
      });
    });

    // Now that the dropdown is open (or if it was already visible), click the action
    // We look outside the .within() block because dropdown menus often render via Portals
    cy.contains(/approve|accept|allow|confirm/i, { timeout: 10000 })
      .first()
      .click({ force: true });
  });
});