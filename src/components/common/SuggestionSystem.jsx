import React, { useState, useRef, useEffect } from 'react';
import { MessageSquarePlus, X, Bug, Lightbulb, Send } from 'lucide-react';

const SuggestionSystem = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState({ email: 'user@example.com', uid: '123' });
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'bug',
    title: '',
    description: '',
    userAgent: navigator.userAgent,
    currentPage: window.location.href,
    timestamp: new Date().toISOString()
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  
  const modalRef = useRef(null);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const submissionData = {
        ...formData,
        userEmail: currentUser?.email || 'anonymous',
        userId: currentUser?.uid || 'anonymous'
      };

      console.log('Submitting:', submissionData);
      
      setSubmitStatus('success');
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          type: 'bug',
          title: '',
          description: '',
          userAgent: navigator.userAgent,
          currentPage: window.location.href,
          timestamp: new Date().toISOString()
        });
        setIsOpen(false);
        setSubmitStatus(null);
      }, 2000);

    } catch (error) {
      console.error('Error submitting suggestion:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'bug',
      title: '',
      description: '',
      userAgent: navigator.userAgent,
      currentPage: window.location.href,
      timestamp: new Date().toISOString()
    });
    setSubmitStatus(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const themeClasses = isDarkMode 
    ? 'bg-gray-900 text-white' 
    : 'bg-white text-gray-900';

  const inputClasses = isDarkMode
    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500';

  return (
    <>

      {/* Floating Suggestion Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 z-40 group  text-gray-50 bg-gradient-to-r from-blue-900/70 to-blue-950/60 dark:fromblue-950/90 dark:to-indigo-950/80"
        aria-label="Open suggestion form"
      >
        <MessageSquarePlus size={24} className="group-hover:rotate-12 transition-transform duration-300" />
      </button>

      {/* Suggestion Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 p-4 flex items-end justify-end">
          <div
            ref={modalRef}
            className={`w-full max-w-md rounded-2xl shadow-2xl transform transition-all duration-300 ease-out ${themeClasses} border ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            } animate-slide-up`}
            style={{
              animation: 'slideInFromBottom 0.3s ease-out',
              transformOrigin: 'bottom right'
            }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  formData.type === 'bug'
                    ? isDarkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-50 text-red-600'
                    : isDarkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-50 text-green-600'
                }`}>
                  {formData.type === 'bug' ? <Bug size={20} /> : <Lightbulb size={20} />}
                </div>
                <h2 className="text-xl font-semibold">Send Suggestion</h2>
              </div>
              <button
                onClick={handleClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'bug' }))}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.type === 'bug'
                        ? isDarkMode
                          ? 'bg-red-900/30 border-red-600 text-red-300 shadow-lg'
                          : 'bg-red-50 border-red-400 text-red-700 shadow-lg'
                        : isDarkMode
                          ? 'border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                          : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <Bug size={18} />
                    <span className="font-medium">Bug Report</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'feature' }))}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.type === 'feature'
                        ? isDarkMode
                          ? 'bg-green-900/30 border-green-600 text-green-300 shadow-lg'
                          : 'bg-green-50 border-green-400 text-green-700 shadow-lg'
                        : isDarkMode
                          ? 'border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                          : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <Lightbulb size={18} />
                    <span className="font-medium">Feature Request</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={formData.type === 'bug' ? 'Brief description of the bug' : 'Brief description of the feature'}
                  className={`w-full p-4 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${inputClasses}`}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={
                    formData.type === 'bug' 
                      ? 'Steps to reproduce, expected vs actual behavior, browser info...'
                      : 'Describe the feature you would like to see and how it would help...'
                  }
                  rows={4}
                  className={`w-full p-4 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none ${inputClasses}`}
                  required
                />
              </div>

              {/* Submit Status */}
              {submitStatus && (
                <div className={`p-4 rounded-xl text-center font-medium transition-all duration-300 ${
                  submitStatus === 'success'
                    ? isDarkMode
                      ? 'bg-green-900/50 text-green-300 border border-green-700'
                      : 'bg-green-50 text-green-700 border border-green-200'
                    : isDarkMode
                      ? 'bg-red-900/50 text-red-300 border border-red-700'
                      : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {submitStatus === 'success' 
                    ? '✓ Suggestion submitted successfully!' 
                    : '✗ Failed to submit. Please try again.'}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
                className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl font-semibold transition-all duration-200 ${
                  isSubmitting || !formData.title.trim() || !formData.description.trim()
                    ? isDarkMode
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit {formData.type === 'bug' ? 'Bug Report' : 'Feature Request'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInFromBottom {
          from {
            transform: translateY(100%) translateX(0);
            opacity: 0;
          }
          to {
            transform: translateY(0) translateX(0);
            opacity: 1;
          }
        }
        
        @media (max-width: 640px) {
          .max-w-md {
            max-width: calc(100vw - 2rem);
            margin: 0 1rem 1rem 1rem;
          }
        }
      `}</style>
    </>
  );
};

export default SuggestionSystem;