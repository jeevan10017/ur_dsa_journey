import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile as updateFirebaseProfile, updateEmail, updatePassword } from 'firebase/auth';
import { getUserProfile, createUserProfile, updateUserProfile } from '../services/firestore';
import { auth } from '../services/firebase'; 
import { Eye, EyeOff, Mail, User as UserIcon, Edit, Save, Camera, X, Check, AlertCircle, Code, Building } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, userProfile, setUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [localUserProfile, setLocalUserProfile] = useState(null);

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
    preferences: {
      theme: 'dark',
      emailReminders: true,
      defaultReminderInterval: '7_days'
    },
    profession: '',
    institution: '',
    leetcodeUsername: '',
    profilePictureUrl: ''
  });

  // Initialize form data
  useEffect(() => {
    const profile = userProfile || localUserProfile;
    if (profile) {
      const initialData = {
        displayName: profile.displayName || user?.displayName || '',
        email: profile.email || user?.email || '',
        newPassword: '',
        confirmPassword: '',
        preferences: {
          theme: profile.preferences?.theme || 'dark',
          emailReminders: profile.preferences?.emailReminders ?? true,
          defaultReminderInterval: profile.preferences?.defaultReminderInterval || '7_days'
        },
        profession: profile.profession || '',
        institution: profile.institution || '',
        leetcodeUsername: profile.leetcodeUsername || '',
        profilePictureUrl: profile.profilePictureUrl || user?.photoURL || ''
      };
      setFormData(initialData);
    } else if (user) {
      // Fallback to user data if no profile exists yet
      setFormData(prev => ({
        ...prev,
        displayName: user.displayName || '',
        email: user.email || '',
        profilePictureUrl: user.photoURL || ''
      }));
    }
  }, [user, userProfile, localUserProfile]);

  // Load user profile if not available from context
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userProfile && user?.uid && !localUserProfile) {
        try {
          const { profile, error } = await getUserProfile(user.uid);
          if (!error && profile) {
            setLocalUserProfile(profile);
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
        }
      }
    };

    loadUserProfile();
  }, [user, userProfile, localUserProfile]);

  // Validation functions
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (formData.confirmPassword && !formData.newPassword) {
      newErrors.newPassword = 'Please enter a new password';
    }

    // LeetCode username validation (optional but if provided, should be valid format)
    if (formData.leetcodeUsername && !/^[a-zA-Z0-9_-]+$/.test(formData.leetcodeUsername)) {
      newErrors.leetcodeUsername = 'LeetCode username can only contain letters, numbers, hyphens, and underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form changes
  const handleChange = useCallback((e) => {
  const { name, value, type, checked } = e.target;
  
  setIsDirty(true);
  
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  // Clear specific field error when user starts typing
  if (errors[name]) {
    setErrors(prev => ({ 
      ...prev, 
      [name]: '' 
    }));
  }
}, [errors]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      setProfilePictureFile(file);
      setIsDirty(true);
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          profilePictureUrl: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected profile picture
  const removeProfilePicture = () => {
    setProfilePictureFile(null);
    setFormData(prev => ({
      ...prev,
      profilePictureUrl: user?.photoURL || ''
    }));
    setIsDirty(true);
    // Clear file input
    const fileInput = document.getElementById('profilePicture');
    if (fileInput) fileInput.value = '';
  };

  // Upload profile picture
  const uploadProfilePicture = async () => {
    if (!profilePictureFile) return null;

    try {
      // Dynamic import to handle missing storage gracefully
      const { storage } = await import('../services/firebase');
      const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');

      return new Promise((resolve, reject) => {
        const storageRef = ref(storage, `profilePictures/${user.uid}/${Date.now()}_${profilePictureFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, profilePictureFile);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              setUploadProgress(0);
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      throw new Error('Firebase Storage not configured');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);

    try {
      const updates = {
        displayName: formData.displayName,
        preferences: formData.preferences,
        profession: formData.profession,
        institution: formData.institution,
        leetcodeUsername: formData.leetcodeUsername,
      };

      // Handle profile picture upload
      if (profilePictureFile) {
        try {
          toast.loading('Uploading profile picture...');
          const downloadURL = await uploadProfilePicture();
          
          if (downloadURL) {
            updates.profilePictureUrl = downloadURL;
            
            // Update Firebase auth profile
            await updateFirebaseProfile(auth.currentUser, {
              photoURL: downloadURL
            });
          }
          toast.dismiss();
        } catch (uploadError) {
          toast.dismiss();
          console.error('Profile picture upload failed:', uploadError);
          if (uploadError.message.includes('not configured')) {
            toast.error('File upload not available. Please contact support.');
          } else {
            toast.error('Profile picture upload failed, but other changes were saved');
          }
        }
      }

      // Handle email update
      if (user.email !== formData.email) {
        await updateEmail(auth.currentUser, formData.email);
        updates.email = formData.email;
      }

      // Handle password update
      if (formData.newPassword && formData.newPassword === formData.confirmPassword) {
        await updatePassword(auth.currentUser, formData.newPassword);
      }

      // Update Firebase auth display name
      if (user.displayName !== formData.displayName) {
        await updateFirebaseProfile(auth.currentUser, {
          displayName: formData.displayName
        });
      }

      // Update user profile in Firestore
      await createUserProfile(user.uid, updates);

      // Fetch updated profile
      const { profile, error } = await getUserProfile(user.uid);
      if (error) {
        toast.error('Profile updated but failed to refresh data');
      } else {
        // Update local state or context
        if (setUserProfile && typeof setUserProfile === 'function') {
          setUserProfile(profile);
        } else {
          setLocalUserProfile(profile);
        }
      }

      // Reset form state
      setFormData(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: ''
      }));
      setProfilePictureFile(null);
      setIsDirty(false);
      setIsEditing(false);

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        setIsEditing(false);
        setIsDirty(false);
        setErrors({});
        setProfilePictureFile(null);
        // Reset form data
        const profile = userProfile || localUserProfile;
        if (profile) {
          setFormData({
            displayName: profile.displayName || user?.displayName || '',
            email: profile.email || user?.email || '',
            newPassword: '',
            confirmPassword: '',
            preferences: {
              theme: profile.preferences?.theme || 'dark',
              emailReminders: profile.preferences?.emailReminders ?? true,
              defaultReminderInterval: profile.preferences?.defaultReminderInterval || '7_days'
            },
            profession: profile.profession || '',
            institution: profile.institution || '',
            leetcodeUsername: profile.leetcodeUsername || '',
            profilePictureUrl: profile.profilePictureUrl || user?.photoURL || ''
          });
        }
      }
    } else {
      setIsEditing(false);
    }
  };

  // Input component with error handling
  const InputField = ({ label, name, type = 'text', icon: Icon, placeholder, required = false, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-100 text:gray-900" />}
      <input
        type={type}
        id={name}
        name={name}
        value={formData[name] || ''}
        onChange={isEditing ? handleChange : undefined}
        readOnly={!isEditing}
        className={`
          ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 w-full
          text-sm
          bg-gray-50 dark:bg-gray-800 
          border border-gray-200 dark:border-gray-700 
          rounded-lg
          focus:ring-2 focus:ring-pink-500 focus:border-transparent
          transition-all duration-200 dark:text-gray-100 text:gray-900
          ${!isEditing ? 'cursor-not-allowed opacity-60' : ''}
          ${errors[name] ? 'border-red-500 focus:ring-red-500' : ''}
        `}
        placeholder={placeholder}
        {...props}
      />
      {errors[name] && (
        <div className="flex items-center mt-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3 mr-1" />
          {errors[name]}
        </div>
      )}
    </div>
  </div>
);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Profile Settings
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your account settings and preferences
            </p>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
                  disabled={loading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !isDirty}
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 rounded-lg transition-colors flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors flex items-center"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Profile Picture
              </h2>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-pink-500 to-purple-600 p-0.5">
                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img
                        src={formData.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName || 'User')}&size=128&background=6366f1&color=ffffff`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  {isEditing && (
                    <label
                      htmlFor="profilePicture"
                      className="absolute -bottom-1 -right-1 bg-pink-600 hover:bg-pink-700 text-white rounded-full p-2 cursor-pointer transition-colors shadow-lg"
                    >
                      <Camera className="h-3 w-3" />
                    </label>
                  )}
                </div>
                
                {isEditing && (
                  <div className="mt-4 w-full">
                    <input
                      type="file"
                      id="profilePicture"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    {profilePictureFile && (
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mt-2">
                        <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                          {profilePictureFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={removeProfilePicture}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {uploadProgress > 0 && (
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-pink-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Uploading... {Math.round(uploadProgress)}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Full Name"
                    name="displayName"
                    icon={UserIcon}
                    placeholder="Enter your full name"
                    required
                  />
                  
                  <InputField
                    label="Email Address"
                    name="email"
                    type="email"
                    icon={Mail}
                    placeholder="Enter your email"
                    required
                  />
                  
                  <div>
                    <label htmlFor="profession" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Profession
                    </label>
                    <div className="relative">
                      <select
                        id="profession"
                        name="profession"
                        value={formData.profession}
                        onChange={isEditing ? handleChange : undefined}
                        disabled={!isEditing}
                        className={`
                          pl-3 pr-3 py-2.5 w-full text-sm
                          bg-gray-50 dark:bg-gray-800 
                          border border-gray-200 dark:border-gray-700 
                          rounded-lg dark:text-gray-100 text:gray-900
                          focus:ring-2 focus:ring-pink-500 focus:border-transparent
                          transition-all duration-200
                          ${!isEditing ? 'cursor-not-allowed opacity-60' : ''}
                        `}
                      >
                        <option value="">Select your profession</option>
                        <option value="student">Student</option>
                        <option value="software_engineer">Software Engineer</option>
                        <option value="data_scientist">Data Scientist</option>
                        <option value="product_manager">Product Manager</option>
                        <option value="designer">Designer</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <InputField
                    label="Institution/Company"
                    name="institution"
                    icon={Building}
                    placeholder="Enter your institution or company"
                  />

                  <InputField
                    label="LeetCode Username"
                    name="leetcodeUsername"
                    icon={Code}
                    placeholder="Enter your LeetCode username"
                  />
                </div>
              </div>

              {/* Security */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Security Settings
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="newPassword" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={isEditing ? handleChange : undefined}
                        readOnly={!isEditing}
                        className={`
                          pl-3 pr-10 py-2.5 w-full text-sm
                          bg-gray-50 dark:bg-gray-800 
                          border border-gray-200 dark:border-gray-700 
                          rounded-lg dark:text-gray-100 text:gray-900
                          focus:ring-2 focus:ring-pink-500 focus:border-transparent
                          transition-all duration-200
                          ${!isEditing ? 'cursor-not-allowed opacity-60' : ''}
                          ${errors.newPassword ? 'border-red-500 focus:ring-red-500' : ''}
                        `}
                        placeholder="Leave blank to keep current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <div className="flex items-center mt-1 text-xs text-red-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.newPassword}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={isEditing ? handleChange : undefined}
                      readOnly={!isEditing}
                      className={`
                        pl-3 pr-3 py-2.5 w-full text-sm
                        bg-gray-50 dark:bg-gray-800 
                        border border-gray-200 dark:border-gray-700 
                        rounded-lg dark:text-gray-100 text:gray-900
                        focus:ring-2 focus:ring-pink-500 focus:border-transparent
                        transition-all duration-200
                        ${!isEditing ? 'cursor-not-allowed opacity-60' : ''}
                        ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}
                      `}
                      placeholder="Confirm your new password"
                    />
                    {errors.confirmPassword && (
                      <div className="flex items-center mt-1 text-xs text-red-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.confirmPassword}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Preferences
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="theme" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Theme
                    </label>
                    <select
                      id="theme"
                      name="preferences.theme"
                      value={formData.preferences.theme}
                      onChange={isEditing ? handleChange : undefined}
                      disabled={!isEditing}
                      className={`
                        pl-3 pr-3 py-2.5 w-full max-w-xs text-sm
                        bg-gray-50 dark:bg-gray-800 
                        border border-gray-200 dark:border-gray-700 
                        rounded-lg dark:text-gray-100 text:gray-900
                        focus:ring-2 focus:ring-pink-500 focus:border-transparent
                        transition-all duration-200
                        ${!isEditing ? 'cursor-not-allowed opacity-60' : ''}
                      `}
                    >
                      <option value="dark">Dark Mode</option>
                      <option value="light">Light Mode</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="emailReminders"
                      name="preferences.emailReminders"
                      checked={formData.preferences.emailReminders}
                      onChange={isEditing ? handleChange : undefined}
                      disabled={!isEditing}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="emailReminders" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
                      Enable email reminders
                    </label>
                  </div>

                  <div>
                    <label htmlFor="defaultReminderInterval" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Default Reminder Interval
                    </label>
                    <select
                      id="defaultReminderInterval"
                      name="preferences.defaultReminderInterval"
                      value={formData.preferences.defaultReminderInterval}
                      onChange={isEditing ? handleChange : undefined}
                      disabled={!isEditing}
                      className={`
                        pl-3 pr-3 py-2.5 w-full max-w-xs text-sm
                        bg-gray-50 dark:bg-gray-800 
                        border border-gray-200 dark:border-gray-700 
                        rounded-lg dark:text-gray-100 text:gray-900
                        focus:ring-2 focus:ring-pink-500 focus:border-transparent
                        transition-all duration-200
                        ${!isEditing ? 'cursor-not-allowed opacity-60' : ''}
                      `}
                    >
                      <option value="1_day">1 Day</option>
                      <option value="3_days">3 Days</option>
                      <option value="7_days">1 Week</option>
                      <option value="14_days">2 Weeks</option>
                      <option value="30_days">1 Month</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;