import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';

// Cache for questions to minimize fetching
let questionsCache = {
  data: [],
  lastFetch: null,
  userId: null
};

const CACHE_DURATION = 5 * 60 * 1000; 

// Helper function to check authentication
const checkAuth = () => {
  const user = auth.currentUser;
  console.log('Current auth state:', {
    isAuthenticated: !!user,
    uid: user?.uid,
    email: user?.email,
    emailVerified: user?.emailVerified
  });
  
  if (!user) {
    throw new Error('User not authenticated. Please sign in again.');
  }
  
  return user;
};

// Helper function to handle Firestore errors with auth context
const handleFirestoreError = (error) => {
  console.error('Firestore error details:', error);
  
  if (error.code === 'permission-denied') {
    const user = auth.currentUser;
    if (!user) {
      return 'Authentication required. Please sign in to continue.';
    }
    return 'Permission denied. Please check your account permissions or try signing in again.';
  }
  
  if (error.code === 'unauthenticated') {
    return 'Authentication expired. Please sign in again.';
  }
  
  if (error.code === 'unavailable' || error.message.includes('blocked')) {
    return 'Connection blocked by ad-blocker or firewall. Please disable ad-blocker and try again.';
  }
  
  if (error.code === 'network-request-failed') {
    return 'Network error. Please check your internet connection.';
  }
  
  if (error.code === 'failed-precondition') {
    return 'Database operation failed. Please try again.';
  }
  
  return error.message || 'An unexpected error occurred.';
};

// Enhanced function with retry mechanism and auth checks
const executeWithRetry = async (operation, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Check auth before each attempt
      checkAuth();
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on auth-related errors
      if (error.code === 'permission-denied' || 
          error.code === 'unauthenticated' ||
          error.message.includes('not authenticated') ||
          error.message.includes('blocked')) {
        throw error;
      }
      
      // For token refresh errors, try to refresh and retry once
      if (error.code === 'auth/id-token-expired' && i === 0) {
        console.log('Token expired, attempting refresh...');
        try {
          const user = auth.currentUser;
          if (user) {
            await user.getIdToken(true); // Force refresh
            console.log('Token refreshed successfully');
            continue; // Retry the operation
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw error;
        }
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Helper function to clear cache
const invalidateCache = () => {
  questionsCache = {
    data: [],
    lastFetch: null,
    userId: null
  };
};

// Helper function to check if cache is valid
const isCacheValid = (userId) => {
  const now = Date.now();
  return questionsCache.userId === userId && 
         questionsCache.lastFetch && 
         (now - questionsCache.lastFetch) < CACHE_DURATION;
};

// Helper function to clean HTML content for display
const cleanHtmlContent = (htmlContent) => {
  if (!htmlContent) return '';
  
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Extract text content and preserve some basic formatting
  return tempDiv.textContent || tempDiv.innerText || '';
};

// Questions CRUD operations with enhanced auth handling and caching
export const createQuestion = async (userId, questionData) => {
  try {
    const user = checkAuth();
    
    if (user.uid !== userId) {
      throw new Error('User ID mismatch. Please sign in again.');
    }
    
    const result = await executeWithRetry(async () => {
      const docRef = await addDoc(collection(db, 'questions'), {
        topics: [],
        solved: false,
        questionLink: "",
        notes: "",
        ...questionData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    });
    
    invalidateCache();
    
    console.log('Question created successfully:', result);
    return { id: result, error: null };
  } catch (error) {
    console.error('Create question error:', error);
    return { id: null, error: handleFirestoreError(error) };
  }
};

export const updateQuestion = async (questionId, updates) => {
  try {
    checkAuth();
    
    await executeWithRetry(async () => {
      const docRef = doc(db, 'questions', questionId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    });
    
    invalidateCache();
    
    console.log('Question updated successfully:', questionId);
    return { error: null };
  } catch (error) {
    console.error('Update question error:', error);
    return { error: handleFirestoreError(error) };
  }
};

export const deleteQuestion = async (questionId) => {
  try {
    checkAuth();
    
    await executeWithRetry(async () => {
      await deleteDoc(doc(db, 'questions', questionId));
    });
    
    invalidateCache();
    
    console.log('Question deleted successfully:', questionId);
    return { error: null };
  } catch (error) {
    console.error('Delete question error:', error);
    return { error: handleFirestoreError(error) };
  }
};

export const getUserQuestions = async (userId, forceRefresh = false) => {
  try {
    const user = checkAuth();
    
    if (user.uid !== userId) {
      throw new Error('User ID mismatch. Please sign in again.');
    }

    // Check cache first if not forcing refresh
    if (!forceRefresh && isCacheValid(userId)) {
      console.log('Returning cached questions');
      return { questions: questionsCache.data, error: null };
    }
    
    const questions = await executeWithRetry(async () => {
      const q = query(
        collection(db, 'questions'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const questionsArray = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        questionsArray.push({ 
          id: doc.id, 
          ...data,
          descriptionText: cleanHtmlContent(data.description),
          notesText: cleanHtmlContent(data.notes)
        });
      });
      
      // Sort client-side by updatedAt (descending)
      questionsArray.sort((a, b) => {
        const aTime = a.updatedAt?.seconds || 0;
        const bTime = b.updatedAt?.seconds || 0;
        return bTime - aTime;
      });
      
      return questionsArray;
    });
    
    // Update cache
    questionsCache = {
      data: questions,
      lastFetch: Date.now(),
      userId: userId
    };
    
    console.log(`Retrieved ${questions.length} questions for user:`, userId);
    return { questions, error: null };
  } catch (error) {
    console.error('Get user questions error:', error);
    return { questions: [], error: handleFirestoreError(error) };
  }
};

export const getQuestion = async (questionId) => {
  try {
    checkAuth();
    
    const question = await executeWithRetry(async () => {
      const docRef = doc(db, 'questions', questionId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return { 
          id: docSnap.id, 
          ...data,
          descriptionText: cleanHtmlContent(data.description),
          notesText: cleanHtmlContent(data.notes)
        };
      } else {
        throw new Error('Question not found');
      }
    });
    
    console.log('Question retrieved successfully:', questionId);
    return { question, error: null };
  } catch (error) {
    console.error('Get question error:', error);
    return { question: null, error: handleFirestoreError(error) };
  }
};

export const getUserTopics = async (userId) => {
  try {
    const { questions, error } = await getUserQuestions(userId);
    
    if (error) {
      return { topics: [], error };
    }
    
    const topicsSet = new Set();
    questions.forEach(question => {
      if (question.topics && Array.isArray(question.topics)) {
        question.topics.forEach(topic => {
          if (topic && topic.trim()) {
            topicsSet.add(topic.trim());
          }
        });
      }
    });
    
    const topics = Array.from(topicsSet).sort();
    return { topics, error: null };
  } catch (error) {
    console.error('Get user topics error:', error);
    return { topics: [], error: handleFirestoreError(error) };
  }
};

// Connection test function with auth check
export const testFirestoreConnection = async () => {
  try {
    const user = checkAuth();
    console.log('Firestore connection test successful - user authenticated:', user.uid);
    return { connected: true, error: null };
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    return { connected: false, error: handleFirestoreError(error) };
  }
};

// Auth state debugging function
export const debugAuthState = () => {
  const user = auth.currentUser;
  const authState = {
    isAuthenticated: !!user,
    uid: user?.uid,
    email: user?.email,
    displayName: user?.displayName,
    emailVerified: user?.emailVerified,
    isAnonymous: user?.isAnonymous,
    tokenPresent: !!user?.accessToken,
    providerData: user?.providerData?.map(p => ({
      providerId: p.providerId,
      uid: p.uid,
      email: p.email
    }))
  };
  
  console.log('Current auth state:', authState);
  return authState;
};

// Clear cache function (useful for manual cache invalidation)
export const clearQuestionsCache = () => {
  invalidateCache();
  console.log('Questions cache cleared');
};

// Reminder operations (keeping existing functionality)
export const createReminder = async (userId, questionId, reminderData) => {
  try {
    const user = checkAuth();
    
    if (user.uid !== userId) {
      throw new Error('User ID mismatch. Please sign in again.');
    }
    
    const result = await executeWithRetry(async () => {
      const docRef = await addDoc(collection(db, 'reminders'), {
        userId,
        questionId,
        ...reminderData,
        createdAt: serverTimestamp(),
        status: 'active'
      });
      return docRef.id;
    });
    
    return { id: result, error: null };
  } catch (error) {
    return { id: null, error: handleFirestoreError(error) };
  }
};

export const getUserReminders = async (userId) => {
  try {
    const user = checkAuth();
    
    if (user.uid !== userId) {
      throw new Error('User ID mismatch. Please sign in again.');
    }
    
    const reminders = await executeWithRetry(async () => {
      const q = query(
        collection(db, 'reminders'),
        where('userId', '==', userId),
        where('status', '==', 'active'),
        orderBy('reminderDate', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const remindersArray = [];
      querySnapshot.forEach((doc) => {
        remindersArray.push({ id: doc.id, ...doc.data() });
      });
      return remindersArray;
    });
    
    return { reminders, error: null };
  } catch (error) {
    return { reminders: [], error: handleFirestoreError(error) };
  }
};


export const createUserProfile = async (userId, profileData) => {
  try {
    const user = checkAuth();
    
    if (user.uid !== userId) {
      throw new Error('User ID mismatch. Please sign in again.');
    }
    
    await executeWithRetry(async () => {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    return { error: null };
  } catch (error) {
    return { error: handleFirestoreError(error) };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const user = checkAuth();
    
    if (user.uid !== userId) {
      throw new Error('User ID mismatch. Please sign in again.');
    }
    
    const profile = await executeWithRetry(async () => {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    });
    
    return { profile, error: null };
  } catch (error) {
    return { profile: null, error: handleFirestoreError(error) };
  }
};