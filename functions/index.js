const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const moment = require('moment');

admin.initializeApp();

// Initialize SendGrid
const initializeSendGrid = () => {
  const apiKey = functions.config().sendgrid?.key;
  if (!apiKey) {
    console.error('SendGrid API key not found');
    return false;
  }
  sgMail.setApiKey(apiKey);
  return true;
};

const sendGridInitialized = initializeSendGrid();

// Helper function to calculate next reminder date
const calculateNextReminderDate = (interval) => {
  const now = new Date();
  const days = {
    '7_days': 7,
    '14_days': 14,
    '30_days': 30
  }[interval] || 7;
  return new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
};

exports.scheduleEmailReminderV2 = functions.firestore
  .document('reminders/{reminderId}')
  .onCreate(async (snapshot, context) => {
    const reminder = snapshot.data();
    const reminderId = context.params.reminderId;
    const now = new Date();
    const reminderDate = reminder.reminderDate.toDate();

    // Skip if not a recurring reminder
    if (reminder.type === 'immediate' || reminder.reminderInterval === 'none') {
      return null;
    }

    // Validate required fields
    if (!reminder.userId || !reminder.questionId) {
      await snapshot.ref.update({ 
        status: 'failed',
        error: 'Missing required fields',
        failedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return null;
    }

    if (!sendGridInitialized) {
      await snapshot.ref.update({ 
        status: 'failed',
        error: 'SendGrid not configured',
        failedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return null;
    }

    const delayMs = reminderDate.getTime() - now.getTime();

    // For short delays (<= 9 minutes)
    if (delayMs > 0 && delayMs <= 540000) {
      setTimeout(async () => {
        await sendReminderEmail(snapshot, reminder);
      }, delayMs);
      return null;
    }

    // For longer delays or past-due reminders
    if (delayMs <= 0 || delayMs > 540000) {
      return sendReminderEmail(snapshot, reminder);
    }

    return null;
  });

exports.stopReminder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { reminderId } = data;
  const userId = context.auth.uid;

  const reminderRef = admin.firestore().doc(`reminders/${reminderId}`);
  const reminderDoc = await reminderRef.get();

  if (!reminderDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Reminder not found');
  }

  const reminderData = reminderDoc.data();
  
  if (reminderData.userId !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Not authorized');
  }

  // Stop all future recurring reminders for this question
  const futureRemindersQuery = admin.firestore()
    .collection('reminders')
    .where('userId', '==', userId)
    .where('questionId', '==', reminderData.questionId)
    .where('status', '==', 'active');

  const futureReminders = await futureRemindersQuery.get();
  const batch = admin.firestore().batch();

  futureReminders.forEach(doc => {
    batch.update(doc.ref, {
      status: 'stopped',
      stoppedAt: admin.firestore.FieldValue.serverTimestamp(),
      stoppedBy: userId
    });
  });

  await batch.commit();
  return { success: true, message: 'Reminders stopped successfully' };
});

exports.stopQuestionReminders = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { questionId } = data;
  const userId = context.auth.uid;

  const remindersQuery = admin.firestore()
    .collection('reminders')
    .where('userId', '==', userId)
    .where('questionId', '==', questionId)
    .where('status', '==', 'active');

  const reminders = await remindersQuery.get();
  const batch = admin.firestore().batch();

  reminders.forEach(doc => {
    batch.update(doc.ref, {
      status: 'stopped',
      stoppedAt: admin.firestore.FieldValue.serverTimestamp(),
      stoppedBy: userId
    });
  });

  await batch.commit();
  return { success: true, message: `Stopped ${reminders.size} reminders` };
});

async function sendReminderEmail(snapshot, reminder) {
  try {
    // Fetch required data
    const [questionSnap, userSnap] = await Promise.all([
      admin.firestore().doc(`questions/${reminder.questionId}`).get(),
      admin.firestore().doc(`users/${reminder.userId}`).get()
    ]);

    if (!questionSnap.exists || !userSnap.exists) {
      throw new Error('Question or user not found');
    }

    const question = questionSnap.data();
    const user = userSnap.data();

    if (!user.email || !question.title) {
      throw new Error('Missing email or question title');
    }

    // Check if user has email reminders enabled
    if (user.preferences?.emailReminders === false) {
      await snapshot.ref.update({ 
        status: 'skipped',
        skipReason: 'Email reminders disabled',
        skippedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return null;
    }

    // Prepare email content
    const formattedDate = moment(reminder.reminderDate.toDate()).format('MMMM Do YYYY, h:mm A');
    const userName = user.displayName || user.email.split('@')[0] || 'User';
    const baseUrl = functions.config().app?.base_url || 'https://ur-dsa-journey.vercel.app';
    const questionUrl = `${baseUrl}/question/${reminder.questionId}`;
    const stopReminderUrl = `${baseUrl}/stop-reminder/${snapshot.id}`;

    const msg = {
      to: user.email,
      from: {
        email: 'jeevan.iitkgp22@gmail.com',
        name: 'DSA Journey'
      },
      subject: `🔔 Revision Reminder: ${question.title}`,
      text: `Hello ${userName},\n\nIt's time to revisit: "${question.title}"\n\nReview Date: ${formattedDate}\nQuestion Link: ${questionUrl}\n\nStop reminders: ${stopReminderUrl}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #1f2937; text-align: center;">🔔 Revision Time!</h1>
            <p>Hello <strong>${userName}</strong>,</p>
            <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 8px; padding: 20px; margin: 20px 0; color: white;">
              <h2>"${question.title}"</h2>
              <p>📅 Scheduled for: ${formattedDate}</p>
            </div>
            <div style="text-align: center;">
              <a href="${questionUrl}" style="background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                🚀 View Question
              </a>
            </div>
            <p style="text-align: center; font-size: 12px; color: #9ca3af;">
              <a href="${stopReminderUrl}" style="color: #ec4899; text-decoration: none;">Stop reminders</a>
            </p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);
    
    // Update database
    const batch = admin.firestore().batch();
    batch.update(snapshot.ref, { 
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Schedule next reminder if recurring
    if (reminder.reminderInterval && reminder.reminderInterval !== 'none') {
      const nextReminderDate = calculateNextReminderDate(reminder.reminderInterval);
      const nextReminderRef = admin.firestore().collection('reminders').doc();
      
      batch.set(nextReminderRef, {
        userId: reminder.userId,
        questionId: reminder.questionId,
        type: 'recurring',
        reminderInterval: reminder.reminderInterval,
        reminderDate: admin.firestore.Timestamp.fromDate(nextReminderDate),
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        parentReminderId: snapshot.id,
        iteration: (reminder.iteration || 0) + 1
      });
    }
    
    await batch.commit();
    
  } catch (error) {
    await snapshot.ref.update({ 
      status: 'failed', 
      error: error.message,
      failedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}