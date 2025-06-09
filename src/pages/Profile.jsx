import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile as updateFirebaseProfile, updateEmail, updatePassword } from 'firebase/auth';
import { getUserProfile, createUserProfile, updateUserProfile } from '../services/firestore';
import { auth } from '../services/firebase'; 
import { Eye, EyeOff, Mail, User as UserIcon, Edit, Save, Camera, X,  Palette, AlertCircle, Code, Building, Shield, Settings, Clock , Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import Footer from '../components/common/Footer';


const InputField = React.memo(({ 
  label, 
  name, 
  type = 'text', 
  icon: Icon, 
  placeholder, 
  required = false,
  value,
  onChange,
  readOnly,
  error,
  success
}) => (
  <div className="group">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <Icon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${
          error ? 'text-red-400' : success ? 'text-green-400' : 'text-gray-400 group-focus-within:text-pink-500'
        }`} />
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className={`
          ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 w-full
          text-sm font-medium
          bg-white dark:bg-gray-800 
          border-2 transition-all duration-300
          rounded-xl
          focus:outline-none focus:ring-4 focus:ring-pink-500/20
          dark:text-gray-100 text-gray-900
          placeholder:text-gray-400
          ${readOnly ? 'cursor-not-allowed opacity-60 bg-gray-50 dark:bg-gray-900' : 'hover:border-gray-300 dark:hover:border-gray-600'}
          ${error ? 'border-red-400 focus:border-red-500' : 
            success ? 'border-green-400 focus:border-green-500' :
            'border-gray-200 dark:border-gray-700 focus:border-pink-500'}
        `}
        placeholder={placeholder}
      />
      {success && (
        <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
      )}
    </div>
    {error && (
      <div className="flex items-center mt-2 text-sm text-red-600 dark:text-red-400">
        <AlertCircle className="h-4 w-4 mr-1.5" />
        {error}
      </div>
    )}
  </div>
));

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
  const { theme: contextTheme, setTheme: contextSetTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('personal');  
  const [successFields, setSuccessFields] = useState({});

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
    preferences: {
      theme: 'dark',
      emailReminders: true,
      defaultReminderInterval: 'none'
    },
    profession: '',
    institution: '',
    leetcodeUsername: '',
    profilePictureUrl: ''
  });

  // Update form data when userProfile or localUserProfile changes
    useEffect(() => {
    if (isEditing) {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          theme: contextTheme
        }
      }));
    }
  }, [contextTheme, isEditing]);

  // Update theme immediately on dropdown change
  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    contextSetTheme(newTheme);
  };

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
          defaultReminderInterval: profile.preferences?.defaultReminderInterval || 'none'
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
              defaultReminderInterval: profile.preferences?.defaultReminderInterval || 'none'
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

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: UserIcon },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ];

 

   return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Manage your account settings and preferences with ease
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
              {/* <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> */}
              {/* <span>Last updated: 2 minutes ago</span> */}
            </div>
          </div>
          
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 flex items-center shadow-sm hover:shadow-md"
                  disabled={loading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !isDirty}
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 disabled:from-pink-400 disabled:to-pink-500 rounded-xl transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Saving Changes...
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
                className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 rounded-xl transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 rounded-xl sm:text-sm text-[10px]  font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-900 text-pink-600 dark:text-pink-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover:shadow-2xl transition-all duration-300">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Camera className="h-5 w-5 mr-2 text-pink-500" />
                Profile Picture
              </h2>
              
              <div className="flex flex-col items-center space-y-6">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-pink-500 via-purple-600 to-blue-600 p-1 shadow-2xl">
                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img
                        src={formData.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName || 'User')}&size=128&background=6366f1&color=ffffff`}
                        alt="Profile"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </div>
                  
                  {isEditing && (
                    <label
                      htmlFor="profilePicture"
                      className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white rounded-full p-3 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
                    >
                      <Camera className="h-4 w-4" />
                    </label>
                  )}
                </div>
                
                {isEditing && (
                  <div className="w-full space-y-4">
                    <input
                      type="file"
                      id="profilePicture"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {profilePictureFile && (
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Upload className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                              {profilePictureFile.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={removeProfilePicture}
                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="space-y-2">
                            <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                              <div className="animate-spin rounded-full h-3 w-3 border border-pink-500 border-t-transparent mr-2"></div>
                              Uploading... {Math.round(uploadProgress)}%
                            </p>
                          </div>
                        )}
                        
                        {uploadProgress === 100 && (
                          <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Upload complete!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Main Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              {activeTab === 'personal' && (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover:shadow-2xl transition-all duration-300">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-8 flex items-center">
                    <UserIcon className="h-6 w-6 mr-3 text-pink-500" />
                    Personal Information
                    <div className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Full Name"
                      name="displayName"
                      icon={UserIcon}
                      placeholder="Enter your full name"
                      required
                      value={formData.displayName}
                      onChange={isEditing ? handleChange : undefined}
                      readOnly={!isEditing}
                      error={errors.displayName}
                      success={successFields.displayName}
                    />
                    
                    <InputField
                      label="Email Address"
                      name="email"
                      type="email"
                      icon={Mail}
                      placeholder="Enter your email"
                      required
                      value={formData.email}
                      onChange={isEditing ? handleChange : undefined}
                      readOnly={!isEditing}
                      error={errors.email}
                      success={successFields.email}
                    />
                    
                    <div className="group">
                      <label htmlFor="profession" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            pl-4 pr-4 py-3 w-full text-sm font-medium
                            bg-white dark:bg-gray-800 
                            border-2 border-gray-200 dark:border-gray-700 
                            rounded-xl dark:text-gray-100 text-gray-900
                            focus:outline-none focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500
                            transition-all duration-300
                            ${!isEditing ? 'cursor-not-allowed opacity-60 bg-gray-50 dark:bg-gray-900' : 'hover:border-gray-300 dark:hover:border-gray-600'}
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
                      value={formData.institution}
                      onChange={isEditing ? handleChange : undefined}
                      readOnly={!isEditing}
                      error={errors.institution}
                    />

                    <InputField
                      label="LeetCode Username"
                      name="leetcodeUsername"
                      icon={Code}
                      placeholder="Enter your LeetCode username"
                      value={formData.leetcodeUsername}
                      onChange={isEditing ? handleChange : undefined}
                      readOnly={!isEditing}
                      error={errors.leetcodeUsername}
                    />
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover:shadow-2xl transition-all duration-300">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-8 flex items-center">
                    <Shield className="h-6 w-6 mr-3 text-pink-500" />
                    Security Settings
                    <div className="ml-auto flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 dark:text-green-400">Secure</span>
                    </div>
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                            pl-4 pr-12 py-3 w-full text-sm font-medium
                            bg-white dark:bg-gray-800 
                            border-2 border-gray-200 dark:border-gray-700 
                            rounded-xl dark:text-gray-100 text-gray-900
                            focus:outline-none focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500
                            transition-all duration-300
                            placeholder:text-gray-400
                            ${!isEditing ? 'cursor-not-allowed opacity-60 bg-gray-50 dark:bg-gray-900' : 'hover:border-gray-300 dark:hover:border-gray-600'}
                            ${errors.newPassword ? 'border-red-400 focus:border-red-500' : ''}
                          `}
                          placeholder="Leave blank to keep current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.newPassword && (
                        <div className="flex items-center mt-2 text-sm text-red-600 dark:text-red-400">
                          <AlertCircle className="h-4 w-4 mr-1.5" />
                          {errors.newPassword}
                        </div>
                      )}
                    </div>

                    <div className="group">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                          pl-4 pr-4 py-3 w-full text-sm font-medium
                          bg-white dark:bg-gray-800 
                          border-2 border-gray-200 dark:border-gray-700 
                          rounded-xl dark:text-gray-100 text-gray-900
                          focus:outline-none focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500
                          transition-all duration-300
                          placeholder:text-gray-400
                          ${!isEditing ? 'cursor-not-allowed opacity-60 bg-gray-50 dark:bg-gray-900' : 'hover:border-gray-300 dark:hover:border-gray-600'}
                          ${errors.confirmPassword ? 'border-red-400 focus:border-red-500' : ''}
                        `}
                        placeholder="Confirm your new password"
                      />
                      {errors.confirmPassword && (
                        <div className="flex items-center mt-2 text-sm text-red-600 dark:text-red-400">
                          <AlertCircle className="h-4 w-4 mr-1.5" />
                          {errors.confirmPassword}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences */}
              {activeTab === 'preferences' && (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover:shadow-2xl transition-all duration-300">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-8 flex items-center">
                    <Settings className="h-6 w-6 mr-3 text-pink-500" />
                    Preferences
                  </h2>
                  
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group">
                        <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Palette className="h-4 w-4 mr-2" />
                          Theme
                        </label>
                        <select
                          id="theme"
                          name="preferences.theme"
                          value={formData.preferences.theme}
                          onChange={
                            isEditing
                              ? (e) => {
                                  handleChange(e);
                                  handleThemeChange(e);
                                }
                              : undefined
                          }
                          disabled={!isEditing}
                          className={`
                            pl-4 pr-4 py-3 w-full text-sm font-medium
                            bg-white dark:bg-gray-800 
                            border-2 border-gray-200 dark:border-gray-700 
                            rounded-xl dark:text-gray-100 text-gray-900
                            focus:outline-none focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500
                            transition-all duration-300
                            ${!isEditing ? 'cursor-not-allowed opacity-60 bg-gray-50 dark:bg-gray-900' : 'hover:border-gray-300 dark:hover:border-gray-600'}
                          `}
                        >
                          <option value="dark">🌙 Dark Mode</option>
                          <option value="light">☀️ Light Mode</option>
                          <option value="system">🖥️ System Default</option>
                        </select>
                      </div>

                      <div className="group">
                        <label htmlFor="defaultReminderInterval" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Default Reminder Interval
                        </label>
                        <select
                          id="defaultReminderInterval"
                          name="preferences.defaultReminderInterval"
                          value={formData.preferences.defaultReminderInterval}
                          onChange={isEditing ? handleChange : undefined}
                          disabled={!isEditing}
                          className={`
                            pl-4 pr-4 py-3 w-full text-sm font-medium
                            bg-white dark:bg-gray-800 
                            border-2 border-gray-200 dark:border-gray-700 
                            rounded-xl dark:text-gray-100 text-gray-900
                            focus:outline-none focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500
                            transition-all duration-300
                            ${!isEditing ? 'cursor-not-allowed opacity-60 bg-gray-50 dark:bg-gray-900' : 'hover:border-gray-300 dark:hover:border-gray-600'}
                          `}
                        >
                          <option value="none">🚫 None</option>
                          <option value="3_days">📅 3 Days</option>
                          <option value="7_days">📅 1 Week</option>
                          <option value="14_days">📅 2 Weeks</option>
                          <option value="30_days">📅 1 Month</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-2">
                            <Bell className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                              Email Notifications
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Receive reminders and updates via email
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            id="emailReminders"
                            name="preferences.emailReminders"
                            checked={formData.preferences.emailReminders}
                            onChange={isEditing ? handleChange : undefined}
                            disabled={!isEditing}
                            className="sr-only peer"
                          />
                          <div className={`
                            relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 
                            peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                            after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                            peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-600
                            ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}
                          `}></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
         
        </div>

        {/* Success Toast */}
        {Object.keys(successFields).length > 0 && (
          <div className="fixed bottom-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 animate-slide-up">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Profile updated successfully!</span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
       <Footer/>
    </div>
  );
};

export default Profile;