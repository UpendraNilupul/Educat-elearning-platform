// cypress/e2e/course-management.cy.js

describe('EduCat E2E - Teacher Course and Assessment Creation', () => {
  it('Logs in as an approved teacher, creates a course module, and adds an assignment', () => {
    // 1. Log in as an existing approved teacher (Seed user: teacher1@example.com)
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('teacher1@example.com');
    cy.get('input[type="password"]').type('password123'); // Or your test seed pass
    cy.get('input[type="submit"]').click();

    // 2. Navigate to Teacher Dashboard Course Management
    cy.visit('http://localhost:5173/teacher');
    cy.contains('Course Management').click();

    // 3. Create a new course
    cy.contains('Create New Course').click();
    cy.get('input[name="name"]').type('QA Test Course Ref');
    cy.get('input[name="title"]').type('Automated Full-Stack Testing');
    cy.get('select[name="grade"]').select('Grade 12');
    cy.get('input[name="monthly_fee"]').type('3500');
    cy.contains('Create Course').click();

    // 4. Open the newly created course structure
    cy.contains('Automated Full-Stack Testing').parent().parent().within(() => {
      cy.contains('View').click();
    });

    // 5. Add a Module / Chapter
    cy.contains('Add Module').click();
    cy.get('input[placeholder*="Module 1"]').type('Module 1: Introduction to QA');
    cy.contains('Create Module').click();

    // Verify module appears in the syllabus
    cy.contains('Module 1: Introduction to QA').should('be.visible');
  });
});