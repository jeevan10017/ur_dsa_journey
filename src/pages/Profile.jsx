import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile as updateFirebaseProfile, updateEmail, updatePassword } from 'firebase/auth';
import { getUserProfile, createUserProfile } from '../services/firestore';
import { auth } from '../services/firebase';
import { Eye, EyeOff, Mail, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, userProfile, setUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
    preferences: {
      theme: 'dark',
      emailReminders: true,
      defaultReminderInterval: '7_days'
    }
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || user.displayName || '',
        email: userProfile.email || user.email || '',
        newPassword: '',
        confirmPassword: '',
        preferences: {
          theme: userProfile.preferences?.theme || 'dark',
          emailReminders: userProfile.preferences?.emailReminders ?? true,
          defaultReminderInterval: userProfile.preferences?.defaultReminderInterval || '7_days'
        }
      });
    }
  }, [user, userProfile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('preferences.')) {
      const prefField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefField]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (user.displayName !== formData.displayName) {
        await updateFirebaseProfile(auth.currentUser, {
          displayName: formData.displayName
        });
      }
      
      if (user.email !== formData.email) {
        await updateEmail(auth.currentUser, formData.email);
      }
      
      if (formData.newPassword && formData.newPassword === formData.confirmPassword) {
        await updatePassword(auth.currentUser, formData.newPassword);
      }
      
      await createUserProfile(user.uid, {
        displayName: formData.displayName,
        email: formData.email,
        preferences: formData.preferences
      });
      
      const { profile } = await getUserProfile(user.uid);
      setUserProfile(profile);
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Your Profile
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="pl-10 input"
                placeholder="Enter your name"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="pl-10 input"
                placeholder="Enter your email"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password (leave blank to keep current)
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="input"
                placeholder="Enter new password"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input"
                placeholder="Confirm new password"
              />
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Preferences
          </h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Theme
              </label>
              <select
                id="theme"
                name="preferences.theme"
                value={formData.preferences.theme}
                onChange={handleChange}
                className="input"
              >
                <option value="dark">Dark Mode</option>
                <option value="light">Light Mode</option>
              </select>
            </div>
            
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailReminders"
                  name="preferences.emailReminders"
                  checked={formData.preferences.emailReminders}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="emailReminders" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Enable email reminders
                </label>
              </div>
            </div>
            
            <div>
              <label htmlFor="defaultReminderInterval" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Reminder Interval
              </label>
              <select
                id="defaultReminderInterval"
                name="preferences.defaultReminderInterval"
                value={formData.preferences.defaultReminderInterval}
                onChange={handleChange}
                className="input"
              >
                <option value="7_days">7 Days</option>
                <option value="14_days">2 Weeks</option>
                <option value="30_days">1 Month</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;