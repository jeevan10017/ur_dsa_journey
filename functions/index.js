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

    console.log('Processing reminder:', {
      reminderId: context.params.reminderId,
      type: reminder.type,
      userId: reminder.userId,
      questionId: reminder.questionId,
      reminderDate: reminderDate,
      now: now
    });

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
  const reminderId = snapshot.id;
  
  try {
    console.log('Attempting to send reminder email:', {
      reminderId,
      userId: reminder.userId,
      questionId: reminder.questionId
    });

    // Add detailed error logging and validation
    if (!reminder.userId) {
      throw new Error('User ID is missing from reminder data');
    }
    
    if (!reminder.questionId) {
      throw new Error('Question ID is missing from reminder data');
    }

    // Fetch documents with detailed logging
    console.log('Fetching question document:', reminder.questionId);
    const questionDocRef = admin.firestore().doc(`questions/${reminder.questionId}`);
    const questionSnap = await questionDocRef.get();
    
    console.log('Fetching user document:', reminder.userId);
    const userDocRef = admin.firestore().doc(`users/${reminder.userId}`);
    const userSnap = await userDocRef.get();

    // Check if documents exist with detailed logging
    if (!questionSnap.exists) {
      console.error('Question document not found:', {
        questionId: reminder.questionId,
        path: `questions/${reminder.questionId}`
      });
      throw new Error(`Question not found: ${reminder.questionId}`);
    }

    if (!userSnap.exists) {
      console.error('User document not found:', {
        userId: reminder.userId,
        path: `users/${reminder.userId}`
      });
      throw new Error(`User not found: ${reminder.userId}`);
    }

    const question = questionSnap.data();
    const user = userSnap.data();

    console.log('Documents fetched successfully:', {
      questionTitle: question?.title,
      userEmail: user?.email,
      userDisplayName: user?.displayName
    });

    // Validate required fields
    if (!user.email) {
      throw new Error('User email is missing');
    }

    if (!question.title) {
      throw new Error('Question title is missing');
    }

    const formattedDate = moment(reminder.reminderDate.toDate()).format('MMMM Do YYYY, h:mm A');
    const userName = user.displayName || user.email?.split('@')[0] || 'User';
    const questionUrl = new URL(
  `/question/${reminder.questionId}`,
  functions.config().app?.base_url || 'https://ur-dsa-journey.vercel.app'
).href;

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

    console.log('Sending email:', {
      to: user.email,
      subject,
      from: 'jeevan.iitkgp22@gmail.com'
    });

    await sgMail.send(msg);
    
    // Update reminder status to sent
    await snapshot.ref.update({ 
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      error: null
    });
    
    console.log(`Reminder email sent successfully to ${user.email} for question: ${question.title}`);
    
  } catch (error) {
    console.error('Error sending reminder email:', {
      reminderId,
      error: error.message,
      stack: error.stack,
      userId: reminder.userId,
      questionId: reminder.questionId
    });
    
    // Update reminder status to failed with detailed error info
    await snapshot.ref.update({ 
      status: 'failed', 
      error: error.message,
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
      errorDetails: {
        message: error.message,
        code: error.code || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  }

  return null;
}