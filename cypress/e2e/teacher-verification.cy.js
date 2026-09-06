// cypress/e2e/teacher-verification.cy.js

describe('EduCat E2E - Teacher Verification & Admin Review', () => {
  const teacherEmail = `qa.teacher.${Date.now()}@example.com`;
  const teacherPassword = 'securepassword123';
  let teacherUserId;

  it('Registers a teacher, submits verification docs, and allows admin approval', () => {
    // 1. Register as a Teacher
    cy.visit('http://localhost:5173/register');
    cy.get('input[name="name"]').type('QA Teacher');
    cy.get('input[name="email"]').type(teacherEmail);
    cy.get('input[name="password"]').type(teacherPassword);
    cy.get('input[name="confirmPassword"]').type(teacherPassword);
    cy.get('input[name="phoneNumber"]').type('+94773333333');
    cy.get('input[name="dob"]').type('1990-01-01');
    cy.get('select[name="province"]').select('Western');
    cy.get('select[name="district"]').select('Colombo');
    cy.get('select[name="gender"]').select('Male');
    cy.get('input[type="radio"][value="teacher"]').click();
    cy.get('input[type="submit"]').click();

    // 2. The app should redirect to the Teacher Verification page
    cy.url().should('include', '/verify-teacher/');

    // 3. Upload NIC and CV documents using fixture files
    cy.get('input[type="file"]').first().selectFile({
      contents: Cypress.Buffer.from('dummy nic document content'),
      fileName: 'nic.pdf',
      mimeType: 'application/pdf',
    }, { force: true });

    cy.get('input[type="file"]').last().selectFile({
      contents: Cypress.Buffer.from('dummy cv document content'),
      fileName: 'cv.pdf',
      mimeType: 'application/pdf',
    }, { force: true });

    cy.contains('Submit Documents').click();

    // Confirm submission alert and redirect to login
    cy.on('window:alert', (str) => {
      expect(str).to.equal('Documents submitted successfully. Please wait for admin approval.');
    });

    // 4. Log out / clear storage and log in as Super Admin
    cy.clearLocalStorage();
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('input[type="submit"]').click();

    // 5. Navigate to Admin Teachers directory and review application
    cy.visit('http://localhost:5173/admin/teachers');
    cy.contains('QA Teacher').should('be.visible');
    
    // Click action menu and select "Review Application"
    cy.get('button').find('svg').first().click();
    cy.contains('Review Application').click();

    // Type approval feedback and approve
    cy.get('textarea').type('Your credentials have been verified. Welcome aboard!');
    cy.contains('Approve Application').click();

    cy.on('window:alert', (str) => {
      expect(str).to.equal('Success! Application approved.');
    });
  });
});