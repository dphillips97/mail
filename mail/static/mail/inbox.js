document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Add event listener for submit and call send_mail
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
  
  // Finally, load sent mailbox
  load_mailbox('sent'); 
}

function view_email(event) {
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

    /* Update email read status if unread
    if (!email['read']) {
      put_read(emailId);  
    }; */
    
    // Get main div
    singleViewDiv = document.querySelector('#single-view');
    
    // Add email info to div
    singleViewDiv.innerHTML += `
      <ul class="no-bullet">
        <li>${email['sender']}</li>
        <li>${email['subject']}</li>
        <li>${email['body']}</li>
        <li><i>${email['timestamp']}</i></li>
      </ul>`;

    // Select (un)-archive button
    archiveButton = document.querySelector('#archive-button');

    // Update data with email id
    archiveButton.dataset.single = `${email['id']}`;

    // Add text to button depending on archived status
    if (email['archived'] === false) {
      archiveButton.innerText = 'Archive';
    } else {
      archiveButton.innerText = 'Un-archive';
    }; 
  });
}

function put_read(emailId) {

  fetch(`/emails/${emailId}`, {
    method: 'PUT',
    body: JSON.stringify({read: true})
  });
}

function put_archive() {

  // Select archive button
  const archiveButton = document.querySelector('#archive-button');

  // Get email id for PUT request
  const emailId = archiveButton.dataset.single;

  // If text is 'Archive', then it's not archived and vice-versa
  if (archiveButton.innerText == 'Archive') {
    const isArchived = false;
  } else {
    const isArchived = true;
  };

  // Swap archive status
  fetch(`/emails/${emailId}`, {
    method: 'PUT',
    body: JSON.stringify({archived: !isArchived})
  })
  .then(response => load_mailbox('inbox'));
}