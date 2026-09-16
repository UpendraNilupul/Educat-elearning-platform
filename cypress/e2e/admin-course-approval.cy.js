describe('Admin - Course Approval', () => {
  it('Approves a pending course and publishes it to the platform', () => {
    cy.viewport(1280, 720);

    // FIX: Use course_id instead of id so the component maps it correctly
    cy.intercept('GET', '**/api/admin/courses-list*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          { course_id: 1, title: 'Mathematics 101', status: 'not_active', teacher_name: 'QA Teacher', total_students: 0, total_revenue: 0 }
        ]
      }
    }).as('getCoursesList');

    cy.intercept('PUT', '**/api/admin/course-status/*').as('approveCourse');

    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.url().should('include', '/admin');
    
    cy.get('nav a[href="/admin/courses"]').click();
    cy.url().should('include', '/admin/courses');

    cy.wait('@getCoursesList', { timeout: 10000 });

    cy.get('select').select('not_active');

    cy.get('tbody button', { timeout: 10000 }).first().click();
    
    cy.contains('Approve & Publish').click();
    cy.on('window:confirm', () => true);

    cy.wait('@approveCourse', { timeout: 10000 }).its('response.statusCode').should('eq', 200);
  });
});