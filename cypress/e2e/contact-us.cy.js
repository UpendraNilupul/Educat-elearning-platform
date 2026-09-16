describe('Public - Contact Us Submission', () => {
  it('Submits a valid inquiry through the contact form', () => {
    cy.visit('http://localhost:5173/contact');
    
    cy.get('input[name="name"]').type('John Doe');
    cy.get('input[name="phone"]').type('+94771234567');
    cy.get('input[name="email"]').type('john.doe@example.com');
    cy.get('textarea[name="message"]').type('I would like more information about the Advanced Level Physics class.');
    
    cy.contains('Send Message').click();
    cy.on('window:alert', (str) => expect(str).to.include('successfully'));
  });
});