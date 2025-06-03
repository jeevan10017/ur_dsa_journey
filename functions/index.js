const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const moment = require('moment');

admin.initializeApp();

// Initialize SendGrid
const initializeSendGrid = () => {
  try {
    const apiKey = functions.config().sendgrid?.key;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      console.log('SendGrid initialized successfully');
    } else {
      console.error('SendGrid API key not found. Set using: firebase functions:config:set sendgrid.key="your-api-key"');
    }
  } catch (error) {
    console.error('Error initializing SendGrid:', error);
  }
};

// Initialize SendGrid
initializeSendGrid();
exports.scheduleEmailReminderV2 = functions.firestore
  .document('reminders/{reminderId}')
  .onCreate(async (snapshot, context) => {
    const reminder = snapshot.data();
    const now = new Date();
    const reminderDate = reminder.reminderDate.toDate();

    // Immediate reminders are sent instantly
    if (reminder.type === 'immediate') {
      return sendReminderEmail(snapshot, reminder);
    }

    const delayMs = reminderDate.getTime() - now.getTime();

    // For delays <= 9 minutes, use setTimeout (only works in background functions, not Cloud Functions)
    // Cloud Functions don't wait for setTimeout; you'd need Cloud Tasks or scheduler for true scheduling
    if (delayMs > 0 && delayMs <= 540000) {
      setTimeout(async () => {
        await sendReminderEmail(snapshot, reminder);
      }, delayMs);
      return null;
    }

    // For longer or past-due reminders, send immediately
    if (delayMs <= 0 || delayMs > 540000) {
      return sendReminderEmail(snapshot, reminder);
    }

    return null;
  });

async function sendReminderEmail(snapshot, reminder) {
  try {
    const [questionSnap, userSnap] = await Promise.all([
      admin.firestore().doc(`questions/${reminder.questionId}`).get(),
      admin.firestore().doc(`users/${reminder.userId}`).get()
    ]);

    if (!questionSnap.exists || !userSnap.exists) {
      throw new Error('Question or user not found');
    }

    const question = questionSnap.data();
    const user = userSnap.data();
    const formattedDate = moment(reminder.reminderDate.toDate()).format('MMMM Do YYYY, h:mm A');
    const userName = user.displayName || 'User';
    const questionUrl = `https://localhost:3000/question/${reminder.questionId}`;

    const subject = reminder.type === 'immediate'
      ? `Question Added: ${question.title}`
      : `Revision Reminder: ${question.title}`;

    const message = reminder.type === 'immediate'
      ? `Hello ${userName},\n\nYou've added a new question: "${question.title}"\n\nQuestion Link: ${questionUrl}\n\nHappy coding!`
      : `Hello ${userName},\n\nIt's time to revisit this question: "${question.title}"\n\nReview Date: ${formattedDate}\nQuestion Link: ${questionUrl}`;

    const msg = {
      to: user.email,
      from: 'jeevan.iitkgp22@gmail.com',
      subject,
      text: message,
      html: `<p>${message.replace(/\n/g, '<br>')}</p>`
    };

    await sgMail.send(msg);
    await snapshot.ref.update({ status: 'sent' });
    console.log(`Reminder email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending email', error);
    await snapshot.ref.update({ status: 'failed', error: error.message });
  }

  return null;
}