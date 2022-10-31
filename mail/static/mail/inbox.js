document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Add event listeners for submit and archive
  document.querySelector('#compose-form').addEventListener('submit', send_mail);
  document.querySelector('#archive-button').addEventListener('click', put_archive);
  
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-view').style.display = 'none';

  // Create var of #emails-view div to add child elements to
  const emailsView = document.querySelector('#emails-view');

  // Show the mailbox name
  emailsView.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {

      // Create div and add event handler
      const entryDiv = document.createElement('div');

      entryDiv.addEventListener('click', view_email);

      // Add data element: email unique id
      entryDiv.dataset.single = `${email['id']}`;

      // Change colors based on 'read' status
      if (email['read'] == true) {
        entryDiv.className = 'entry';
      } else {
        entryDiv.className = 'entry entry-unread';
      }

      // Display email data in entryDiv
      entryDiv.innerHTML = `
        <ul class="no-bullet">
          <li><b>${email['timestamp']}</b></li>
          <li><b>${email['sender']}</b></li>
          <li> Re: <b>${email['subject']}</b></li>
        </ul>`;

      // Add entry div to parent div
      emailsView.append(entryDiv);

    })
  });
}

function send_mail(event) {
  
  // Just in case
  event.preventDefault();

  fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
        })
  })
  .then(response => response.json())
  .then(result => {
    //console.log(result);
  });
  
  load_mailbox('sent'); 
}

function view_email(event) {
  /* Archive button needs 2 pieces of info, email-id and archive-status.
    But adding a button using JS then adding an event listener didn't work 
    because the button wasn't created when the event listener was supposed 
    to be attached. This is a work-around using the archive button's 2 data attributes.
  */

  event.preventDefault();

  // Show #single-view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-view').style.display = 'block';
  
  // Get email id from clicked email
  const emailId = this.dataset.single;

  // GET request to get email's info
  fetch(`/emails/${emailId}`)
  .then(response => response.json())
  .then(email => {

    // Select email content div and li content
    const emailContent = document.querySelector('#email-content');
    const liSender = document.querySelector('#li-sender');
    const liSubject = document.querySelector('#li-subject');
    const liBody = document.querySelector('#li-body');
    const liTimestamp = document.querySelector('#li-timestamp');

    // Add email info to div
    liSender.innerHTML = `${email['sender']}`;
    liSubject.innerHTML = `${email['subject']}`;
    liBody.innerHTML = `${email['body']}`;
    liTimestamp.innerHTML = `<i>${email['timestamp']}</i>`;

    const archiveButton = document.querySelector('#archive-button');

    // Add email id to button to allow for function call
    archiveButton.setAttribute("data-id", emailId);

    // Data element name will be rendered in HTML as all lowercase
    archiveButton.setAttribute("data-archivestatus", email['archived']);

    // Add text to button depending on archived status
    if (email['archived'] === false) {
      archiveButton.innerText = 'Archive';
    } else {
      archiveButton.innerText = 'De-archive';
    }; 
  });
}

function put_read(emailId) {

  fetch(`/emails/${emailId}`, {
    method: 'PUT',
    body: JSON.stringify({read: true})
  });
}

function put_archive(event) {
  
  // Get archive status data and cast to boolean
  const isArchived = (this.dataset.archivestatus === 'true');

  // Swap archive status
  fetch(`/emails/${this.dataset.id}`, {
    method: 'PUT',
    body: JSON.stringify({archived: !isArchived})
  })
  .then(response => load_mailbox('inbox'));
}