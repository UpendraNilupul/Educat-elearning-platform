describe('EduCat E2E - Bank Slip Upload and Approval Flow', () => {
  const studentEmail = `qa.payer.${Date.now()}@example.com`;
  const studentPassword = 'securepassword123';

  it('Allows a student to upload a bank slip and an admin to approve it', () => {
    // --- PART 1: STUDENT REGISTRATION & SLIP UPLOAD ---
    cy.visit('http://localhost:5173/register');

    cy.get('input[name="name"]').type('Paying Student');
    cy.get('input[name="email"]').type(studentEmail);
    cy.get('input[name="password"]').type(studentPassword);
    cy.get('input[name="confirmPassword"]').type(studentPassword);
    cy.get('input[name="phoneNumber"]').type('+94772222222');
    cy.get('input[name="dob"]').type('2004-05-15');
    cy.get('select[name="province"]').select('Western');
    cy.get('select[name="district"]').select('Colombo');
    cy.get('select[name="gender"]').select('Male');
    cy.get('input[type="radio"][value="student"]').click();
    cy.get('input[type="submit"]').click();

    // Verify student dashboard login
    cy.url().should('include', '/student');

    // Go to Lessons/Classes tab to find an unpaid class
    cy.contains('Classes').click();

    // Force open the payment modal for the first available unpaid class/portal
    // (This clicks the portal entry which triggers the payment dropdown)
    cy.get('button').contains('Enter Portal').first().click();

    // Click "Enroll Now" or "Make a Payment" to open the payment checkout card
    cy.get('button').contains(/Enroll Now|Make a Payment/).first().click();

    // Select the "Upload Bank Slip" option
    cy.contains('Upload Bank Slip').click();

    // Attach a fixture file to the file input. 
    // Cypress looks for files in cypress/fixtures. Let's create a dummy file or use an input selector.
    // We can select the file input directly:
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('dummy image file content'),
      fileName: 'test-slip.jpg',
      mimeType: 'image/jpeg',
    }, { force: true });

    // Submit the bank slip
    cy.contains('Submit Bank Slip').click();

    // Verify success alert/message appears
    cy.on('window:alert', (str) => {
      expect(str).to.equal('Slip uploaded successfully. Pending admin approval.');
    });

    // --- PART 2: ADMIN APPROVAL FLOW ---
    // Log out student
    cy.contains('Logout').click();

    // Log in as Super Admin (using your default seed credentials from master SQL)
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin.user@example.com');
    cy.get('input[type="password"]').type('admin123'); // Adjust if your seed password hash differs
    cy.get('input[type="submit"]').click();

    // Navigate directly to the Slip Approvals dashboard
    cy.visit('http://localhost:5173/admin/slips');

    // Verify the student's submission appears in the table
    cy.contains('Paying Student').should('be.visible');

    // Click the Approve icon/button for this record
    cy.get('button').find('svg').first().click(); // Approving the first pending slip in the queue

    // Confirm the browser confirmation dialog
    cy.on('window:confirm', () => true);

    // Verify success notice
    cy.on('window:alert', (str) => {
      expect(str).to.equal('Payment approved successfully!');
    });
  });
});