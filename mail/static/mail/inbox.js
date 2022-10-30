document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Add event listener for submit and call send_mail
  document.querySelector('#compose-form').addEventListener('submit', send_mail);

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
      //console.log(email);

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

      // Display email data
      entryDiv.innerHTML = `
        <ul class="no-bullet">
          <li><b>${email['timestamp']}</b></li>
          <li><b>${email['sender']}</b></li>
          <li> Re: <b>${email['subject']}</b></li>
        </ul>`;

      // Add email entry div to parent div
      emailsView.append(entryDiv);

    })
  });

}

function send_mail(event) {
  event.preventDefault()

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
  event.preventDefault();

  // Show #single-view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-view').style.display = 'block';
  
  // Get email id from clicked email
  const emailId = this.dataset.single;

  // Send GET request to API
  fetch(`/emails/${emailId}`)
  .then(response => response.json())
  .then(email => {

    console.log(email['read']);

    // Get inner div and populate with info
    singleViewInnerDiv = document.querySelector('.single-view-inner');
    singleViewInnerDiv.innerHTML = `
      <ul class="no-bullet">
        <li>${email['sender']}</li>
        <li>${email['subject']}</li>
        <li>${email['body']}</li>
        <li><i>${email['timestamp']}</i></li>
      </ul>`;

    // Add email elements to inner div
    const singleView = document.querySelector('#single-view');
    singleView.append(singleViewInnerDiv);

  }) // End GET call process

  // Update email sent status
  put_sent(emailId);

} // End view_email

function put_sent(emailId) {

  fetch(`/emails/${emailId}`, {
    method: 'PUT',
    body: JSON.stringify({read: true})
  }) // Close PUT call
  .then((response) => {
    if (response.status == 204) {
      console.log(`${response.status}: email is now read!`);
    } else {
      console.log('Put request failed.')
    }
  }); // End PUT status update
}