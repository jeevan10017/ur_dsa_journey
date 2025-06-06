import { 
  collection, 
  Timestamp, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  getDoc,
  query,
  where,
  getDocs,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// Cache for user preferences to reduce Firestore reads
const userPreferencesCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Ensure user profile exists in Firestore with better error handling
const ensureUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
     
    if (!userSnap.exists()) {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Validate email before creating profile
      if (!currentUser.email) {
        throw new Error('User email is required but missing from authentication');
      }

      const userData = {
        uid: userId,
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email.split('@')[0] || 'User',
        emailVerified: currentUser.emailVerified,
        preferences: {
          emailReminders: true,
          defaultReminderInterval: 'none',
          theme: 'light'
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(userRef, userData);
      console.log('User profile created successfully:', userId);
      
      // Cache the preferences
      userPreferencesCache.set(userId, {
        data: userData.preferences,
        timestamp: Date.now()
      });
      
      return userData;
    } else {
      const userData = userSnap.data();
      
      // Validate that user has email in their profile
      if (!userData.email) {
        console.warn('User profile missing email, updating from auth');
        const currentUser = auth.currentUser;
        if (currentUser?.email) {
          await updateDoc(userRef, {
            email: currentUser.email,
            updatedAt: serverTimestamp()
          });
          userData.email = currentUser.email;
        }
      }
      
      // Cache the preferences
      if (userData.preferences) {
        userPreferencesCache.set(userId, {
          data: userData.preferences,
          timestamp: Date.now()
        });
      }
      
      console.log('User profile already exists:', userId);
      return userData;
    }
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    throw error;
  }
};

// Get user preferences with caching
export const getUserPreferences = async (userId) => {
  try {
    // Check cache first
    const cached = userPreferencesCache.get(userId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('Using cached preferences for user:', userId);
      return cached.data;
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log('User profile not found, creating with default preferences');
      const userData = await ensureUserProfile(userId);
      return userData.preferences;
    }
    
    const userData = userSnap.data();
    const preferences = userData.preferences || {
      emailReminders: true,
      defaultReminderInterval: 'none',
      theme: 'light'
    };

    // Update cache
    userPreferencesCache.set(userId, {
      data: preferences,
      timestamp: Date.now()
    });

    return preferences;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {
      emailReminders: false,
      defaultReminderInterval: 'none',
      theme: 'light'
    };
  }
};

// Check if user has email reminders enabled with caching
const checkEmailPreferences = async (userId) => {
  try {
    const preferences = await getUserPreferences(userId);
    return preferences?.emailReminders !== false;
  } catch (error) {
    console.error('Error checking email preferences:', error);
    return false;
  }
};

// Cancel existing reminders for a question using batch operations
const cancelExistingReminders = async (userId, questionId) => {
  try {
    const remindersRef = collection(db, 'reminders');
    const q = query(
      remindersRef,
      where('userId', '==', userId),
      where('questionId', '==', questionId),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No existing reminders to cancel');
      return;
    }

    // Use batch for better performance
    const batch = writeBatch(db);
    
    querySnapshot.forEach((docSnapshot) => {
      batch.update(docSnapshot.ref, {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log(`Cancelled ${querySnapshot.size} existing reminders for question:`, questionId);
  } catch (error) {
    console.error('Error cancelling existing reminders:', error);
    throw error;
  }
};

// Schedule recurring email reminders with comprehensive validation
export const scheduleEmailReminder = async (userId, questionId, reminderInterval) => {
  try {
    // Comprehensive input validation
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!reminderInterval) {
      throw new Error('Reminder interval is required');
    }

    console.log('Scheduling email reminder:', {
      userId,
      questionId,
      reminderInterval
    });

    // If no reminder is selected, cancel existing reminders and skip scheduling
    if (reminderInterval === 'none') {
      console.log('No reminder selected, cancelling existing reminders');
      await cancelExistingReminders(userId, questionId);
      return true;
    }

    // Check if user has email reminders enabled
    const emailRemindersEnabled = await checkEmailPreferences(userId);
    if (!emailRemindersEnabled) {
      console.log('Email reminders disabled for user:', userId);
      await cancelExistingReminders(userId, questionId);
      return true;
    }

    // Ensure user profile exists and has email
    const userData = await ensureUserProfile(userId);
    if (!userData.email) {
      throw new Error('User profile is missing email address');
    }

    const daysMap = {
      '7_days': 7,
      '14_days': 14,
      '30_days': 30
    };
    
    const days = daysMap[reminderInterval];
    
    if (!days) {
      throw new Error(`Invalid reminder interval: ${reminderInterval}`);
    }
    
    console.log('Scheduling recurring reminders:', {
      userId,
      questionId,
      reminderInterval,
      days,
      userEmail: userData.email
    });
    
    // Cancel any existing reminders for this question first
    await cancelExistingReminders(userId, questionId);
    
    // Schedule the first reminder
    const firstReminderDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const reminderData = {
      userId,
      questionId,
      reminderDate: Timestamp.fromDate(firstReminderDate),
      reminderInterval: reminderInterval,
      status: 'active',
      createdAt: serverTimestamp(),
      type: 'recurring',
      iteration: 1
    };

    console.log('Creating first recurring reminder:', {
      ...reminderData,
      reminderDate: firstReminderDate.toISOString()
    });
    
    const reminderRef = await addDoc(collection(db, 'reminders'), reminderData);
    console.log('Recurring reminder created with ID:', reminderRef.id);
    
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

// Function to stop reminders for a specific question using Cloud Function
export const stopQuestionReminders = async (questionId) => {
  try {
    const stopRemindersFunction = httpsCallable(functions, 'stopQuestionReminders');
    const result = await stopRemindersFunction({ questionId });
    console.log('Reminders stopped successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error stopping reminders:', error);
    throw error;
  }
};

// Function to stop a specific reminder using Cloud Function
export const stopSpecificReminder = async (reminderId) => {
  try {
    const stopReminderFunction = httpsCallable(functions, 'stopReminder');
    const result = await stopReminderFunction({ reminderId });
    console.log('Reminder stopped successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error stopping reminder:', error);
    throw error;
  }
};

// Function to get user's active reminders
export const getUserActiveReminders = async (userId) => {
  try {
    const remindersRef = collection(db, 'reminders');
    const q = query(
      remindersRef,
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    const reminders = [];
    
    querySnapshot.forEach((doc) => {
      reminders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return reminders;
  } catch (error) {
    console.error('Error getting user reminders:', error);
    throw error;
  }
};

// Function to update user email preferences with cache invalidation
export const updateEmailPreferences = async (userId, emailRemindersEnabled) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'preferences.emailReminders': emailRemindersEnabled,
      updatedAt: serverTimestamp()
    });
    
    // Invalidate cache
    userPreferencesCache.delete(userId);
    
    // If disabling email reminders, cancel all active reminders
    if (!emailRemindersEnabled) {
      const activeReminders = await getUserActiveReminders(userId);
      
      if (activeReminders.length > 0) {
        const batch = writeBatch(db);
        
        activeReminders.forEach(reminder => {
          const reminderRef = doc(db, 'reminders', reminder.id);
          batch.update(reminderRef, {
            status: 'cancelled',
            cancelledAt: serverTimestamp(),
            reason: 'User disabled email reminders'
          });
        });
        
        await batch.commit();
        console.log(`Cancelled ${activeReminders.length} reminders due to preference change`);
      }
    }
    
    console.log('Email preferences updated for user:', userId);
    return true;
  } catch (error) {
    console.error('Error updating email preferences:', error);
    throw error;
  }
};

// Function to update user's default reminder interval with cache invalidation
export const updateDefaultReminderInterval = async (userId, interval) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'preferences.defaultReminderInterval': interval,
      updatedAt: serverTimestamp()
    });
    
    // Invalidate cache
    userPreferencesCache.delete(userId);
    
    console.log('Default reminder interval updated for user:', userId);
    return true;
  } catch (error) {
    console.error('Error updating default reminder interval:', error);
    throw error;
  }
};

// Function to update user theme preference with cache invalidation
export const updateThemePreference = async (userId, theme) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'preferences.theme': theme,
      updatedAt: serverTimestamp()
    });
    
    // Invalidate cache
    userPreferencesCache.delete(userId);
    
    console.log('Theme preference updated for user:', userId);
    return true;
  } catch (error) {
    console.error('Error updating theme preference:', error);
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

// Utility function to clear cache (useful for debugging or user logout)
export const clearUserPreferencesCache = (userId = null) => {
  if (userId) {
    userPreferencesCache.delete(userId);
  } else {
    userPreferencesCache.clear();
  }
};