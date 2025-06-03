import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
        console.log('User details:', user ? { uid: user.uid, email: user.email } : 'No user');
        
        setUser(user);
        setAuthError(null);
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setAuthError(error.message);
        setUser(null);
        setLoading(false);
      }
    );

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
    loading,
    authError,
    isAuthenticated,
    getAuthToken,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };