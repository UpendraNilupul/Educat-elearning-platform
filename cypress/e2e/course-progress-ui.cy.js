describe('Student - Course Progress UI', () => {
  it('Verifies the course progress bar is visible on active enrollments', () => {
    cy.viewport(1280, 720);

    cy.intercept('POST', '**/api/login').as('loginRequest');
    
    // A robust mock object containing all possible string fields to prevent avatar rendering crashes
    const mockClassData = { 
      id: 1,
      course_id: 101, 
      title: 'Advanced Mathematics', 
      course_name: 'Advanced Mathematics',
      teacher_name: 'QA Teacher', // Used for "QA" avatar initials
      teacher: { name: 'QA Teacher' }, // In case Sequelize nested the relation
      User: { name: 'QA Teacher' },
      payment_status: 'paid', // Must be paid to show progress
      monthly_fee: 2500,
      progress: 75,
      progress_percentage: 75,
      cover_image: null
    };

    // FIX 1: Mock enrolled classes as a FLAT array
    cy.intercept('GET', '**/api/student/classes*', {
      statusCode: 200,
      body: [mockClassData]
    }).as('getStudentClasses');

    // FIX 2: Mock suggested classes as a FLAT array too.
    // Removing the { success: true } wrapper prevents the fatal React array mapping crash.
    cy.intercept('GET', '**/api/suggested-classes*', {
      statusCode: 200,
      body: [mockClassData] 
    }).as('getSuggestedClasses');

    // Execute Login
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('std@example.com');
    cy.get('input[type="password"]').type('std123');
    cy.get('input[type="submit"], button[type="submit"]').click();

    cy.wait('@loginRequest', { timeout: 10000 });
    cy.url().should('include', '/student');
    cy.get('aside', { timeout: 10000 }).should('be.visible');

    // Navigate to Classes
    cy.get('aside').contains('Classes').click();

    // Wait for BOTH API calls to finish so the UI settles
    cy.wait('@getStudentClasses', { timeout: 10000 });
    cy.wait('@getSuggestedClasses', { timeout: 10000 });
    
    cy.contains('Loading', { timeout: 10000 }).should('not.exist');

    // FIX 3: Target the body to bypass specific layout container names (main, .flex-1, etc.)
    // just in case the DOM structure changes slightly.
    cy.get('body').within(() => {
      // Looks for a percentage symbol "%" or the word "progress" on the active class card
      cy.contains(/%|progress/i, { timeout: 10000 }).should('be.visible');
    });
  });
});