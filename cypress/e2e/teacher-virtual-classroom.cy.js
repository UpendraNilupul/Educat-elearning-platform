describe('Teacher - Virtual Classroom', () => {
  it('Schedules a new live class session', () => {
    cy.viewport(1280, 720);

    cy.intercept('POST', '**/api/login').as('loginRequest');
    
    // FIX: Stub the courses API endpoint to guarantee test data is present
    cy.intercept('GET', '**/api/courses*', {
      statusCode: 200,
      body: [
        { id: 101, title: 'Mathematics 101', name: 'Mathematics 101' }
      ]
    }).as('getCourses');

    cy.intercept('POST', '**/api/teacher/liveclasses').as('saveLiveClass');

    cy.visit('http://localhost:5173/login');
    
    cy.get('input[type="email"]').type('tchr@example.com');
    cy.get('input[type="password"]').type('tchr123');
    cy.get('button[type="submit"], input[type="submit"]').click();

    cy.wait('@loginRequest', { timeout: 10000 });
    cy.visit('http://localhost:5173/teacher');

    cy.contains(/virtual classroom|classes|live/i, { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.contains(/schedule class|new class|create/i).click({ force: true });

    cy.wait('@getCourses', { timeout: 10000 });

    cy.get('select[name="course_id"]', { timeout: 10000 })
      .should('be.visible')
      .select('101');

    cy.get('input[name="title"]').type('Introduction to E2E Testing');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    cy.get('input[name="date"]').clear().type(dateStr);

    cy.get('input[name="time"]').clear().type('10:00');
    cy.get('input[name="link"]').clear().type('https://zoom.us/j/1234567890');

    cy.contains('button', /save class/i).click();

    cy.wait('@saveLiveClass', { timeout: 10000 }).its('response.statusCode').should('be.oneOf([200, 201]);');
  });
});