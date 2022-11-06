document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Add event listeners for functions I wrote
  document.querySelector('#compose-form').addEventListener('submit', send_mail);
  document.querySelector('#archive-button').addEventListener('click', put_archive);
  document.querySelector('#reply-button').addEventListener('click', compose_email);
  
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(event) {

  // GET call to fill if event (reply button clicked)
  if (event.target.id=='reply-button'){

    const emailId = this.dataset.id;

    // GET request to get email's info
    fetch(`/emails/${emailId}`)
    .then(response => response.json())
    .then(email => {

      recipients.value = `${email['sender']}`;
      subject.value = `Re: ${email['subject']}`;
      body.value = `On ${email['timestamp']}, ${email['sender']} wrote:`;
      body.value += `\n${email['body']}`;
      });
  }
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#single-view').style.display = 'none';

    // Select composition fields
    const recipients = document.querySelector('#compose-recipients');
    const subject = document.querySelector('#compose-subject');
    const body = document.querySelector('#compose-body');

    // Clear out composition fields
    recipients.value = '';
    subject.value = '';
    body.value = '';
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

      //console.log(`Email id: ${email['id']} is (read) ${email['read']}`);

      // Check if email has been read and style appropriately
      if (email['read'] == false) {
        entryDiv.className = 'entry-unread';
      } else {
        entryDiv.className = 'entry-read';
      };

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
  .then(response => load_mailbox('sent'));
}

function view_email(event) {

  /*
  Archive button needs 2 pieces of info, email-id and archive-status.
    But adding a button using JS then adding an event listener didn't work 
    because the button wasn't created when the event listener was supposed 
    to be attached. This is a work-around using the archive button's 2 data 
    attributes.
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

    // Select email content div
    const emailContent = document.querySelector('#email-content');

    // Select li elements
    const liSender = document.querySelector('#li-sender');
    const liRecipients = document.querySelector('#li-recipients');
    const liSubject = document.querySelector('#li-subject');
    const liBody = document.querySelector('#li-body');
    const liTimestamp = document.querySelector('#li-timestamp');

    // Add email info to div
    liSender.innerHTML = `From: ${email['sender']}`;
    liRecipients.innerHTML = `To: ${email['recipients']}`;
    liSubject.innerHTML = `Re: ${email['subject']}`;
    liBody.innerHTML = `${email['body']}`;
    liTimestamp.innerHTML = `<i>${email['timestamp']}</i>`;

    const archiveButton = document.querySelector('#archive-button');

    // Add email id to archive button to allow for function call
    archiveButton.setAttribute("data-id", emailId);

    // Data element name will be rendered in HTML as all lowercase
    archiveButton.setAttribute("data-archivestatus", email['archived']);

    // Add text to button depending on archived status
    if (email['archived'] === false) {
      archiveButton.innerText = 'Archive';
    } else {
      archiveButton.innerText = 'De-archive';
    };

    // Add data attribute to reply button
    const replyButton = document.querySelector('#reply-button');

    replyButton.setAttribute("data-id", email['id']);

    // Update read status
    if (email['read'] == false); {
      fetch(`/emails/${email['id']}`, {
          method: 'PUT',
          body: JSON.stringify({read: true})
        })
    };
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