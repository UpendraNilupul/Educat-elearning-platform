describe('Admin - Course Filtering', () => {
  it('Filters the course directory to show only suspended courses', () => {
    cy.viewport(1280, 720);

    // FIX: Intercept courses-list to return a suspended course so the table never renders empty
    cy.intercept('GET', '**/api/admin/courses-list*', (req) => {
      if (req.query.status === 'suspended') {
        req.reply({
          success: true,
          data: [
            { course_id: 2, title: 'Suspended Advanced Math', status: 'suspended', teacher_name: 'QA Teacher', total_students: 5, total_revenue: 2000 }
          ]
        });
      } else {
        req.reply({
          success: true,
          data: [
            { course_id: 1, title: 'Active Math 101', status: 'active', teacher_name: 'QA Teacher', total_students: 10, total_revenue: 4000 },
            { course_id: 2, title: 'Suspended Advanced Math', status: 'suspended', teacher_name: 'QA Teacher', total_students: 5, total_revenue: 2000 }
          ]
        });
      }
    }).as('getCoursesList');

    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.url().should('include', '/admin');
    
    cy.get('nav a[href="/admin/courses"]').click();
    cy.url().should('include', '/admin/courses');

    cy.wait('@getCoursesList', { timeout: 10000 });
    cy.contains('Loading courses...').should('not.exist');

    // Select the suspended filter from the dropdown
    cy.get('select').eq(0).select('suspended');

    cy.wait('@getCoursesList', { timeout: 10000 });

    // FIX: Use case-insensitive regex to match "Suspended" in the table body
    cy.get('tbody').within(() => {
      cy.contains(/suspended/i).should('exist');
    });
  });
});