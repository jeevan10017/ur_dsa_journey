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
  arrayUnion, 
  serverTimestamp,
  setDoc,
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

// export const updateQuestion = async (questionId, updates) => {
//   try {
//     checkAuth();
    
//     await executeWithRetry(async () => {
//       const docRef = doc(db, 'questions', questionId);
//       await updateDoc(docRef, {
//         ...updates,
//         updatedAt: serverTimestamp()
//       });
//     });
    
//     invalidateCache();
    
//     console.log('Question updated successfully:', questionId);
//     return { error: null };
//   } catch (error) {
//     console.error('Update question error:', error);
//     return { error: handleFirestoreError(error) };
//   }
// };

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

// User Profile operations
export const createUserProfile = async (userId, profileData) => {
  try {
    const user = checkAuth();
    
    if (user.uid !== userId) {
      throw new Error('User ID mismatch. Please sign in again.');
    }
    
    await executeWithRetry(async () => {
      const docRef = doc(db, 'users', userId);
      await setDoc(docRef, {
        ...profileData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true }); // Use merge to avoid overwriting existing data
    });
    
    console.log('User profile created/updated successfully:', userId);
    return { error: null };
  } catch (error) {
    console.error('Create user profile error:', error);
    return { error: handleFirestoreError(error) };
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    const user = checkAuth();
    
    if (user.uid !== userId) {
      throw new Error('User ID mismatch. Please sign in again.');
    }
    
    await executeWithRetry(async () => {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    });
    
    console.log('User profile updated successfully:', userId);
    return { error: null };
  } catch (error) {
    console.error('Update user profile error:', error);
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
    
    console.log('User profile retrieved successfully:', userId);
    return { profile, error: null };
  } catch (error) {
    console.error('Get user profile error:', error);
    return { profile: null, error: handleFirestoreError(error) };
  }
};



// Updated firestore service functions - No question copies approach

export const createShare = async (questionId, shareData) => {
  try {
    const user = checkAuth();
    
    // Verify user owns the question
    const { question, error: questionError } = await getQuestion(questionId);
    if (questionError) throw new Error(questionError);
    
    if (question.userId !== user.uid) {
      throw new Error('You can only share your own questions');
    }
    
    // Create the share document (metadata only)
    const shareRef = doc(collection(db, 'shares'));
    await setDoc(shareRef, {
      ...shareData,
      questionId,
      createdBy: user.uid,
      createdAt: serverTimestamp()
    });
    
    // Add share reference to the original question
    await updateDoc(doc(db, 'questions', questionId), {
  shareIds: arrayUnion(shareRef.id),
  updatedAt: serverTimestamp()
});

    return { id: shareRef.id, error: null };
  } catch (error) {
    return { id: null, error: handleFirestoreError(error) };
  }
};

export const getQuestion = async (questionId, shareId = null) => {
  try {
    if (shareId) {
      // First validate the share exists and get share metadata
      const { share, error: shareError } = await getShare(shareId);
      if (shareError) throw new Error(shareError);
      if (!share) throw new Error('Share not found');
      
      // Get the actual question using the questionId from share
      const actualQuestionId = share.questionId;
      const docRef = doc(db, 'questions', actualQuestionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return { question: null, error: 'Question not found' };
      }
      
      const questionData = docSnap.data();
      
      // Return question with share context
      return { 
        question: {
          ...questionData,
          id: actualQuestionId,
          _shareContext: {
            shareId: shareId,
            accessLevel: share.accessLevel,
            shareType: share.type
          }
        },
        error: null 
      };
    } else {
      // Direct access requires authentication
      checkAuth();
      const docRef = doc(db, 'questions', questionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { 
          question: {
            ...docSnap.data(),
            id: questionId
          },
          error: null 
        };
      }
      return { question: null, error: 'Question not found' };
    }
  } catch (error) {
    console.error('Get question error:', error);
    return { question: null, error: handleFirestoreError(error) };
  }
};

export const getQuestionHistory = async (questionId, shareId = null) => {
  try {
    let actualQuestionId = questionId;
    let canAccessHistory = false;
    
    if (shareId) {
      // Validate share access first
      const { share, error: shareError } = await getShare(shareId);
      if (shareError) throw new Error(shareError);
      if (!share) throw new Error('Share not found');
      
      actualQuestionId = share.questionId;
      // Check if share allows history access (comment level and above)
      canAccessHistory = ['comment', 'edit'].includes(share.accessLevel);
      
      if (!canAccessHistory) {
        return { history: [], error: null }; // Return empty for view-only access
      }
    } else {
      // Direct access requires authentication and ownership
      checkAuth();
      canAccessHistory = true;
    }
    
    if (!actualQuestionId) {
      return { history: [], error: 'Question ID not found' };
    }

    try {
      const q = query(
        collection(db, 'questions', actualQuestionId, 'history'),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const historyArray = [];
      querySnapshot.forEach((doc) => {
        historyArray.push({ id: doc.id, ...doc.data() });
      });
      return { history: historyArray, error: null };
    } catch (error) {
      console.warn('Could not load history:', error);
      return { history: [], error: null };
    }
  } catch (error) {
    console.error('Get question history error:', error);
    return { history: [], error: handleFirestoreError(error) };
  }
};

export const getShare = async (shareId) => {
  try {
    console.log('Getting share:', shareId);
    
    const docRef = doc(db, 'shares', shareId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const shareData = docSnap.data();
      console.log('Share data retrieved:', shareData);
      
      return {
        share: {
          id: shareId,
          ...shareData
        },
        error: null
      };
    }
    
    console.log('Share not found:', shareId);
    return { 
      share: null, 
      error: 'Share not found' 
    };
    
  } catch (error) {
    console.error('Error getting share:', error);
    
    // Handle specific auth errors
    if (error.code === 'permission-denied') {
      return { 
        share: null, 
        error: 'Access denied - authentication required for private share' 
      };
    }
    
    return { 
      share: null, 
      error: handleFirestoreError(error) 
    };
  }
};

// Helper function to check if user can perform action on question
export const checkQuestionAccess = (question, user, requiredLevel = 'view', shareId = null) => {
  // If it's a shared question
  if (shareId && question._shareContext) {
    const accessLevels = ['view', 'comment', 'edit'];
    const userLevel = question._shareContext.accessLevel || 'view';
    const requiredIndex = accessLevels.indexOf(requiredLevel);
    const userIndex = accessLevels.indexOf(userLevel);
    
    // For private shares, also check if user is authenticated if required
    if (question._shareContext.shareType === 'private' && requiredLevel !== 'view') {
      if (!user) return false;
    }
    
    return userIndex >= requiredIndex;
  }
  
  // For direct access, user must own the question
  return user && question.userId === user.uid;
};

// Updated function to add comments with proper access control
export const addQuestionHistory = async (questionId, historyData, shareId = null) => {
  try {
    // If accessing via share, validate permissions
    if (shareId) {
      const { share, error: shareError } = await getShare(shareId);
      if (shareError) throw new Error(shareError);
      if (!share) throw new Error('Share not found');
      
      // Check if share allows commenting
      if (!['comment', 'edit'].includes(share.accessLevel)) {
        throw new Error('Insufficient permissions to add comments');
      }
      
      // For private shares requiring auth
      if (share.type === 'private' && !checkAuth()) {
        throw new Error('Authentication required');
      }
      
      questionId = share.questionId; // Use actual question ID
    } else {
      // Direct access requires authentication
      checkAuth();
    }
    
    const user = getCurrentUser(); // Implement this helper
    await executeWithRetry(async () => {
      await addDoc(collection(db, 'questions', questionId, 'history'), {
        ...historyData,
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        timestamp: serverTimestamp(),
        viaShare: shareId || null
      });
    });
    return { error: null };
  } catch (error) {
    return { error: handleFirestoreError(error) };
  }
};

// Helper to get current user (implement based on your auth context)
const getCurrentUser = () => {
  // This should return the current user from your auth context
  // For now, assuming you have access to auth state
  return auth.currentUser;
};

// Updated updateQuestion function to handle shared questions
export const updateQuestion = async (questionId, updates, shareId = null) => {
  try {
    let actualQuestionId = questionId;
    let canEdit = false;
    
    if (shareId) {
      // If accessing via share, validate edit permissions
      const { share, error: shareError } = await getShare(shareId);
      if (shareError) throw new Error(shareError);
      if (!share) throw new Error('Share not found');
      
      actualQuestionId = share.questionId;
      
      // Check if share allows editing
      if (share.accessLevel !== 'edit') {
        throw new Error('Insufficient permissions to edit this question');
      }
      
      // For private shares, require authentication
      if (share.type === 'private') {
        const user = checkAuth();
        
        // If email is specified in share, verify it matches user's email
        if (share.email && share.email.trim() !== '' && user.email !== share.email) {
          throw new Error('Access denied - email does not match share permissions');
        }
      }
      
      canEdit = true;
    } else {
      // Direct access requires authentication and ownership
      const user = checkAuth();
      
      // Get the question to verify ownership
      const { question, error: questionError } = await getQuestion(actualQuestionId);
      if (questionError) throw new Error(questionError);
      if (!question) throw new Error('Question not found');
      
      if (question.userId !== user.uid) {
        throw new Error('You can only edit your own questions');
      }
      
      canEdit = true;
    }
    
    if (!canEdit) {
      throw new Error('Edit permission denied');
    }
    
    await executeWithRetry(async () => {
      const docRef = doc(db, 'questions', actualQuestionId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        ...(shareId && { lastEditedViaShare: shareId })
      });
    });
    
    invalidateCache();
    
    console.log('Question updated successfully:', actualQuestionId);
    return { error: null };
  } catch (error) {
    console.error('Update question error:', error);
    return { error: handleFirestoreError(error) };
  }
};

// Updated function to check if current user can edit a question
export const canUserEditQuestion = async (questionId, shareId = null) => {
  try {
    if (shareId) {
      const { share, error: shareError } = await getShare(shareId);
      if (shareError) return { canEdit: false, error: shareError };
      if (!share) return { canEdit: false, error: 'Share not found' };
      
      // Check edit permission
      if (share.accessLevel !== 'edit') {
        return { canEdit: false, error: 'No edit permission' };
      }
      
      // For private shares, check authentication and email
      if (share.type === 'private') {
        try {
          const user = checkAuth();
          if (share.email && share.email.trim() !== '' && user.email !== share.email) {
            return { canEdit: false, error: 'Email mismatch' };
          }
        } catch (authError) {
          return { canEdit: false, error: 'Authentication required' };
        }
      }
      
      return { canEdit: true, error: null };
    } else {
      // Direct access - check ownership
      try {
        const user = checkAuth();
        const { question, error: questionError } = await getQuestion(questionId);
        
        if (questionError) return { canEdit: false, error: questionError };
        if (!question) return { canEdit: false, error: 'Question not found' };
        
        const canEdit = question.userId === user.uid;
        return { canEdit, error: canEdit ? null : 'Not question owner' };
      } catch (authError) {
        return { canEdit: false, error: 'Authentication required' };
      }
    }
  } catch (error) {
    return { canEdit: false, error: handleFirestoreError(error) };
  }
};

// Helper function to get question with proper access control
export const getQuestionWithAccess = async (questionId, shareId = null) => {
  try {
    const { question, error } = await getQuestion(questionId, shareId);
    if (error || !question) {
      return { question: null, error: error || 'Question not found', canEdit: false };
    }
    
    const { canEdit } = await canUserEditQuestion(questionId, shareId);
    
    return { 
      question: {
        ...question,
        _canEdit: canEdit
      }, 
      error: null, 
      canEdit 
    };
  } catch (error) {
    return { question: null, error: handleFirestoreError(error), canEdit: false };
  }
};


// Suggestion operations
export const addSuggestion = async (suggestionData) => {
  try {
    const user = checkAuth();
    
    const suggestion = {
      ...suggestionData,
      userId: user.uid,
      userEmail: user.email,
      status: 'open',
      priority: suggestionData.type === 'bug' ? 'high' : 'medium',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'suggestions'), suggestion);
    return { id: docRef.id, error: null };
  } catch (error) {
    return { id: null, error: handleFirestoreError(error) };
  }
};

export const getSuggestions = async () => {
  try {
    checkAuth();
    const q = query(collection(db, 'suggestions'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const suggestions = [];
    querySnapshot.forEach((doc) => {
      suggestions.push({ id: doc.id, ...doc.data() });
    });
    return { suggestions, error: null };
  } catch (error) {
    return { suggestions: [], error: handleFirestoreError(error) };
  }
};

export const updateSuggestionStatus = async (suggestionId, status) => {
  try {
    checkAuth();
    await updateDoc(doc(db, 'suggestions', suggestionId), {
      status,
      updatedAt: serverTimestamp()
    });
    return { error: null };
  } catch (error) {
    return { error: handleFirestoreError(error) };
  }
};