import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserProfile } from '../services/firestore'; // Make sure this import exists

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const updateUserProfile = (profile) => {
    setUserProfile(profile);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      console.log('User details:', user ? { uid: user.uid, email: user.email } : 'No user');
      
      if (user) {
        // Force token refresh to ensure it's current
        try {
          await user.getIdToken(true);
          console.log('Token refreshed successfully');
          
          // Load user profile from Firestore
          try {
            const { profile, error } = await getUserProfile(user.uid);
            if (!error && profile) {
              setUserProfile(profile);
              console.log('User profile loaded:', profile);
            } else {
              console.log('No user profile found or error:', error);
              setUserProfile(null);
            }
          } catch (profileError) {
            console.error('Error loading user profile:', profileError);
            setUserProfile(null);
          }
        } catch (refreshError) {
          console.error('Token refresh error:', refreshError);
        }
      } else {
        // Clear user profile when user logs out
        setUserProfile(null);
      }
      
      setUser(user);
      setAuthError(null);
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setAuthError(error.message);
      setUser(null);
      setUserProfile(null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Function to check if user is properly authenticated
  const isAuthenticated = () => {
    return user && user.uid && !authError;
  };

  // Function to get auth token (useful for debugging)
  const getAuthToken = async () => {
    if (!user) return null;
    try {
      const token = await user.getIdToken();
      console.log('Auth token retrieved successfully');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      setAuthError(error.message);
      return null;
    }
  };

  // Function to refresh auth token
  const refreshAuth = async () => {
    if (!user) return false;
    try {
      await user.getIdToken(true); // Force refresh
      console.log('Auth token refreshed successfully');
      setAuthError(null);
      return true;
    } catch (error) {
      console.error('Error refreshing auth token:', error);
      setAuthError(error.message);
      return false;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    authError,
    isAuthenticated,
    getAuthToken,
    refreshAuth,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };