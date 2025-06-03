import { collection, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase'; 

export const scheduleEmailReminder = async (userId, questionId, reminderInterval) => {
  try {
    const daysMap = {
      '7_days': 7,
      '14_days': 14,
      '30_days': 30
    };
    
    const days = daysMap[reminderInterval];
    if (!days) return;
    
    // Create immediate reminder (send now)
    await addDoc(collection(db, 'reminders'), {
      userId,
      questionId,
      reminderDate: Timestamp.fromDate(new Date()), // Current time
      status: 'scheduled',
      createdAt: serverTimestamp(),
      type: 'immediate'
    });
    
    // Create future reminder
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await addDoc(collection(db, 'reminders'), {
      userId,
      questionId,
      reminderDate: Timestamp.fromDate(futureDate),
      status: 'scheduled',
      createdAt: serverTimestamp(),
      type: 'scheduled'
    });
    
    return true;
  } catch (error) {
    console.error('Error scheduling reminders:', error);
    throw error;
  }
};