import { collection, Timestamp, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

// Ensure user profile exists in Firestore
const ensureUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Get current user info from Firebase Auth
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Create user profile with auth data
      const userData = {
        uid: userId,
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        emailVerified: currentUser.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(userRef, userData);
      console.log('User profile created successfully:', userId);
      return userData;
    } else {
      console.log('User profile already exists:', userId);
      return userSnap.data();
    }
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    throw error;
  }
};

export const scheduleEmailReminder = async (userId, questionId, reminderInterval) => {
  try {
    // Validate inputs
    if (!userId || !questionId || !reminderInterval) {
      throw new Error('Missing required parameters: userId, questionId, or reminderInterval');
    }

    // Ensure user profile exists before creating reminders
    await ensureUserProfile(userId);

    const daysMap = {
      '7_days': 7,
      '14_days': 14,
      '30_days': 30
    };
    
    const days = daysMap[reminderInterval];
    
    // If no reminder is selected, skip scheduling
    if (reminderInterval === 'none' || !days) {
      console.log('No reminder scheduled for interval:', reminderInterval);
      return true;
    }
    
    console.log('Scheduling reminders:', {
      userId,
      questionId,
      reminderInterval,
      days
    });
    
    // Create immediate reminder (send now)
    const immediateReminder = {
      userId,
      questionId,
      reminderDate: Timestamp.fromDate(new Date()), // Current time
      status: 'scheduled',
      createdAt: serverTimestamp(),
      type: 'immediate'
    };

    console.log('Creating immediate reminder:', immediateReminder);
    const immediateRef = await addDoc(collection(db, 'reminders'), immediateReminder);
    console.log('Immediate reminder created with ID:', immediateRef.id);
    
    // Create future reminder
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const futureReminder = {
      userId,
      questionId,
      reminderDate: Timestamp.fromDate(futureDate),
      status: 'scheduled',
      createdAt: serverTimestamp(),
      type: 'scheduled'
    };

    console.log('Creating future reminder:', {
      ...futureReminder,
      reminderDate: futureDate.toISOString()
    });
    const futureRef = await addDoc(collection(db, 'reminders'), futureReminder);
    console.log('Future reminder created with ID:', futureRef.id);
    
    return true;
  } catch (error) {
    console.error('Error scheduling reminders:', {
      error: error.message,
      userId,
      questionId,
      reminderInterval
    });
    throw error;
  }
};

// Additional helper function to create user profile manually if needed
export const createUserProfileIfNotExists = async (userId, additionalData = {}) => {
  try {
    return await ensureUserProfile(userId, additionalData);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};